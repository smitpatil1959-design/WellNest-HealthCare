import routes from '../server-api-handlers/routes.js';

function routeSegments(req) {
  const routePath = req.query?.path;
  if (Array.isArray(routePath)) return routePath.map(String);
  if (typeof routePath === 'string') return routePath.split('/').filter(Boolean);

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  return pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default async function handler(req, res) {
  const actualSegments = routeSegments(req).map(decodeSegment);
  const match = routes.find(({ segments }) => segments.length === actualSegments.length
    && segments.every((segment, index) => segment === ':id' || segment === actualSegments[index]));

  if (!match) return res.status(404).json({ success: false, error: 'Not found' });

  req.query ||= {};
  delete req.query.path;
  const idIndex = match.segments.indexOf(':id');
  if (idIndex !== -1) req.query.id = actualSegments[idIndex];

  try {
    const { default: routeHandler } = await match.load();
    return await routeHandler(req, res);
  } catch(error) {
    console.error('[API failure]',error?.code||'UNAVAILABLE');
    if(res.headersSent)return;
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({error:'This service is temporarily unavailable. Retry without submitting duplicate changes.'});
  }
}
