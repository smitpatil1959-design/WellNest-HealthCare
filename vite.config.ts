import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'node:fs'
import { pathToFileURL } from 'url'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ApiRequest = IncomingMessage & { query?: Record<string, string>; body?: unknown };
type ApiResponse = ServerResponse & {
  status(code: number): ApiResponse;
  json(payload: unknown): ApiResponse;
};

const apiEndpoints = new Set([
  'access-grants', 'access-requests', 'app-notifications', 'appointments', 'consent', 'health-audit', 'health-id',
  'health-lookup', 'insurance', 'lab-reports', 'medications', 'notifications',
  'patient-notifications', 'prescriptions', 'profile', 'record-share', 'records',
  'vaccinations', 'doctors', 'hospitals', 'timeline',
  'admin/pending-applications', 'admin/approve-applicant', 'admin/organizations',
  'insurance/claims', 'insurance/policies',
  'lab/orders', 'lab/report-versions',
  'pharmacy/prescriptions', 'organizations',
]);

function findApiRoute(baseDir: string, segments: string[]): { filePath: string; params: Record<string, string> } | null {
  function match(currentDir: string, segIdx: number, params: Record<string, string>): { filePath: string; params: Record<string, string> } | null {
    if (segIdx === segments.length) {
      const indexPath = path.join(currentDir, 'index.js');
      if (fs.existsSync(indexPath)) return { filePath: indexPath, params };
      return null;
    }

    const seg = segments[segIdx];
    const isLast = segIdx === segments.length - 1;

    if (isLast) {
      const exactFile = path.join(currentDir, `${seg}.js`);
      if (fs.existsSync(exactFile)) return { filePath: exactFile, params };
    }

    const exactDir = path.join(currentDir, seg);
    if (fs.existsSync(exactDir) && fs.statSync(exactDir).isDirectory()) {
      const res = match(exactDir, segIdx + 1, params);
      if (res) return res;
    }

    if (fs.existsSync(currentDir) && fs.statSync(currentDir).isDirectory()) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const dynMatch = entry.name.match(/^\[([a-zA-Z0-9_]+)\](\.js)?$/);
        if (!dynMatch) continue;
        const paramName = dynMatch[1];
        const isFile = dynMatch[2] === '.js' && entry.isFile();
        const isDirectory = !dynMatch[2] && entry.isDirectory();

        if (isLast && isFile) {
          return {
            filePath: path.join(currentDir, entry.name),
            params: { ...params, [paramName]: seg },
          };
        }

        if (!isLast && isDirectory) {
          const res = match(path.join(currentDir, entry.name), segIdx + 1, { ...params, [paramName]: seg });
          if (res) return res;
        }
      }
    }

    return null;
  }

  return match(baseDir, 0, {});
}

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const apiReq = req as ApiRequest;
        const apiRes = res as ApiResponse;
        if (apiReq.url && apiReq.url.startsWith('/api/')) {
          try {
            const urlObj = new URL(apiReq.url, `http://${apiReq.headers.host || 'localhost'}`);
            const pathname = urlObj.pathname.replace(/^\/api\//, '').replace(/\.js$/, '');
            const segments = pathname.split('/').filter(Boolean);

            if (segments.length === 0 || !segments.every((s) => /^[a-zA-Z0-9_-]+$/.test(s))) {
              apiRes.setHeader('Content-Type', 'application/json');
              apiRes.statusCode = 404;
              apiRes.end(JSON.stringify({ success: false, error: 'API endpoint not found.' }));
              return;
            }

            const baseApiDir = path.resolve(process.cwd(), 'server-api-handlers');
            const resolved = findApiRoute(baseApiDir, segments);
            if (!resolved && !apiEndpoints.has(pathname)) {
              apiRes.setHeader('Content-Type', 'application/json');
              apiRes.statusCode = 404;
              apiRes.end(JSON.stringify({ success: false, error: 'API endpoint not found.' }));
              return;
            }
            if (!resolved) {
              apiRes.setHeader('Content-Type', 'application/json');
              apiRes.statusCode = 404;
              apiRes.end(JSON.stringify({ success: false, error: 'API endpoint not found.' }));
              return;
            }

            const query: Record<string, string> = { ...resolved.params };
            for (const [k, v] of urlObj.searchParams.entries()) {
              query[k] = v;
            }
            apiReq.query = query;

            if (typeof apiRes.status !== 'function') {
              apiRes.status = function (code: number) {
                this.statusCode = code;
                return this;
              };
            }
            if (typeof apiRes.json !== 'function') {
              apiRes.json = function (payload: unknown) {
                if (!this.getHeader('Content-Type')) {
                  this.setHeader('Content-Type', 'application/json');
                }
                this.end(JSON.stringify(payload));
                return this;
              };
            }

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(apiReq.method || '')) {
              const chunks: Buffer[] = [];
              for await (const chunk of apiReq) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              const raw = Buffer.concat(chunks).toString('utf-8');
              try {
                apiReq.body = raw ? JSON.parse(raw) : {};
              } catch {
                apiReq.body = {};
              }
            } else {
              apiReq.body = {};
            }

            const fileUrl = pathToFileURL(resolved.filePath).href;
            const mod = await import(`${fileUrl}?t=${Date.now()}`);
            if (typeof mod.default === 'function') {
              await mod.default(apiReq, apiRes);
            } else {
              apiRes.status(404).json({ success: false, error: `Endpoint /api/${pathname} not found` });
            }
          } catch (err: unknown) {
            console.error('[API dev error]', err);
            if (!apiRes.headersSent) {
              apiRes.setHeader('Content-Type', 'application/json');
              apiRes.status(500).json({ success: false, error: err instanceof Error ? err.message : 'API Execution Error' });
            }
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss(), apiDevServerPlugin()];
  try {
    // @ts-expect-error Generated optional helper is not present in all deployments.
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {
    // The source-tag helper is optional.
  }

  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  }

  const publicEnv = Object.entries(env).filter(([key]) => key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_'));
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of publicEnv) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
