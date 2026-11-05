import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Load the actual TypeScript modules with explicit boundary mocks; no network or accounts.
function moduleLoader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const resolved = path.resolve(root, file);
    if (resolved.endsWith(`${path.sep}lib${path.sep}supabase.ts`)) return { default: {} };
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const output = ts.transpileModule(readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (!specifier.startsWith('.')) return require(specifier);
      const base = path.resolve(path.dirname(resolved), specifier);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(candidate => existsSync(candidate));
      if (!target) throw new Error(`Could not resolve ${specifier}`);
      return load(target);
    };
    new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

const load = moduleLoader();
const { appNavByRole, accountNav } = load('src/config/appNav.ts');
const { dashboardPathFor, isRouteAllowedForRole } = load('src/services/auth/authService.ts');

function declaredRoutes() {
  const source = ts.createSourceFile('AppRoutes.tsx', readFileSync(path.join(root, 'src/routes/AppRoutes.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const routes = new Set();
  function walk(node, parent = '') {
    let current = parent;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (opening.tagName.getText(source) === 'Route') {
        const attributes = opening.attributes.properties.filter(ts.isJsxAttribute);
        const routePath = attributes.find(attribute => attribute.name.getText(source) === 'path');
        if (routePath?.initializer && ts.isStringLiteral(routePath.initializer)) current = `${parent}/${routePath.initializer.text}`.replace(/\/+/g, '/');
        const index = attributes.some(attribute => attribute.name.getText(source) === 'index');
        if (routePath || index) routes.add(current || '/');
      }
    }
    ts.forEachChild(node, child => walk(child, current));
  }
  walk(source);
  return routes;
}

const routes = declaredRoutes();
for (const [role, items] of Object.entries(appNavByRole)) {
  test(`${role}: every sidebar destination has a real page and belongs to its portal`, () => {
    assert.equal(new Set(items.map(item => item.href)).size, items.length);
    assert.equal(items[0].href, dashboardPathFor(role));
    for (const item of [...items, ...accountNav]) {
      assert.ok(routes.has(item.href), `${item.label}: missing route ${item.href}`);
      assert.ok(isRouteAllowedForRole(item.href, role), `${item.href} not allowed for ${role}`);
    }
    for (const otherRole of Object.keys(appNavByRole).filter(value => value !== role)) {
      assert.equal(isRouteAllowedForRole(dashboardPathFor(otherRole), role), false);
    }
  });
}

const Navigate = () => null;
function guestResult(auth, state = {}) {
  const localLoad = moduleLoader({
    '../../providers/AuthProvider': { useAuth: () => auth },
    'react-router-dom': { Navigate, useLocation: () => ({ state }) },
  });
  return localLoad('src/components/auth/GuestRoute.tsx').GuestRoute({ children: 'login-form' });
}

test('an unauthenticated visitor gets the sign-in form', () => {
  assert.equal(guestResult({ user: null, loading: false }), 'login-form');
});

test('sign-in returns the user to the authorized page they originally requested', () => {
  const result = guestResult({ user: { id: 'test' }, role: 'patient', loading: false }, { from: '/app/patient/records' });
  assert.equal(result.type, Navigate);
  assert.equal(result.props.to, '/app/patient/records');
});

test('sign-in cannot redirect a patient to a staff portal', () => {
  const result = guestResult({ user: { id: 'test' }, role: 'patient', loading: false }, { from: '/app/admin/users' });
  assert.equal(result.props.to, '/app/patient');
});

test('professional applicants continue to the verification screen', () => {
  const result = guestResult({ user: { id: 'test' }, role: 'patient', pendingProfessionalRole: 'doctor', loading: false });
  assert.equal(result.props.to, '/role-setup');
});

test('a profile still loading does not redirect to verification prematurely', () => {
  const result = guestResult({ user: { id: 'test' }, role: null, loading: true });
  assert.notEqual(result.type, Navigate);
});

test('a stale portal choice cannot send a signed-in user back to a public role page', () => {
  const result = guestResult({ user: { id: 'test' }, role: 'doctor', loading: false }, { requestedRole: 'patient' });
  assert.equal(result.props.to, '/app/doctor');
});

const redirects = load('src/lib/authRedirect.ts');
function browserStorage(values = {}) {
  const storage = { ...values };
  Object.defineProperties(storage, {
    getItem: { value: key => Object.hasOwn(storage, key) ? storage[key] : null },
    setItem: { value: (key, value) => { storage[key] = String(value); } },
    removeItem: { value: key => { delete storage[key]; } },
  });
  return storage;
}

test('a branding namespace change preserves valid Google sign-in intent and rejects an external origin', () => {
  const previousWindow = globalThis.window;
  const origin = 'https://wellnest.example';
  const sessionStorage = browserStorage({ 'previous-brand.google.return': JSON.stringify({origin,startedAt:Date.now(),from:'/app/doctor'}) });
  globalThis.window = { location:{origin},sessionStorage };
  try {
    assert.equal(redirects.readGoogleSignIn().from,'/app/doctor');
    assert.equal(sessionStorage.getItem('previous-brand.google.return'),null);
    assert.ok(sessionStorage.getItem('wellnest.google.return'));
    redirects.clearGoogleSignIn();
    sessionStorage.setItem('previous-brand.google.return',JSON.stringify({origin:'https://other.example',startedAt:Date.now()}));
    assert.equal(redirects.readGoogleSignIn(),null);
    assert.equal(sessionStorage.getItem('previous-brand.google.return'),null);
  } finally { if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow; }
});

test('remembered email moves to the new branding namespace and unchecking remember clears older namespaces', () => {
  const previousStorage=globalThis.localStorage;
  const storage=browserStorage({'previous-brand.remember.email':'test@example.test'});
  globalThis.localStorage=storage;
  try {
    const profileStore=load('src/services/auth/profileStore.ts');
    assert.equal(profileStore.readRememberedEmail(),'test@example.test');
    assert.equal(storage.getItem('wellnest.remember.email'),'test@example.test');
    assert.equal(storage.getItem('previous-brand.remember.email'),null);
    storage.setItem('previous-brand.remember.email','older@example.test');
    profileStore.writeRememberedEmail(null);
    assert.equal(profileStore.readRememberedEmail(),'');
  } finally { if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage; }
});

test('Google callback keeps the exact current origin in development and production', () => {
  for (const origin of ['http://127.0.0.1:5174', 'http://localhost:5173', 'https://wellnest-healthcare.vercel.app']) {
    assert.equal(redirects.googleCallbackUrl(origin), `${origin}/auth/callback`);
  }
});

test('OAuth navigation context accepts workspace pages and rejects external or escaped destinations', () => {
  assert.equal(redirects.safeWorkspaceReturn('/app/patient/records?filter=lab'), '/app/patient/records?filter=lab');
  for (const value of ['https://example.com', '//example.com/app', '/for/doctors', '/', '/app/../../elsewhere', '/app\\example.com', null]) {
    assert.equal(redirects.safeWorkspaceReturn(value), undefined);
  }
});

test('Google return markers are recognized without treating password recovery as Google sign-in', () => {
  assert.equal(redirects.hasAuthReturnParameters('', '#access_token=fixture&type=signup'), true);
  assert.equal(redirects.hasAuthReturnParameters('?code=fixture', ''), true);
  assert.equal(redirects.hasAuthReturnParameters('', '#error=access_denied'), true);
  assert.equal(redirects.hasAuthReturnParameters('', '#access_token=fixture&type=recovery'), false);
  assert.equal(redirects.hasAuthReturnParameters('', '#how-it-works'), false);
});

function callbackResult(auth, from, search = '') {
  const localLoad = moduleLoader({
    react: { ...require('react'), useEffect: () => {} },
    '../../providers/AuthProvider': { useAuth: () => auth },
    '../../lib/authRedirect': { readGoogleSignIn: () => from ? { from } : null, clearGoogleSignIn: () => {} },
    'react-router-dom': { Navigate, useLocation: () => ({ search, hash: '' }) },
  });
  return localLoad('src/pages/auth/AuthCallbackPage.tsx').default();
}

for (const role of Object.keys(appNavByRole)) {
  test(`Google return opens the ${role} portal directly`, () => {
    const result = callbackResult({ user: { id: 'test' }, role, loading: false });
    assert.equal(result.type, Navigate);
    assert.equal(result.props.to, dashboardPathFor(role));
  });
}

test('Google return keeps an authorized deep link after the external round trip', () => {
  const result = callbackResult({ user: { id: 'test' }, role: 'doctor', loading: false }, '/app/doctor/appointments');
  assert.equal(result.props.to, '/app/doctor/appointments');
});

test('Google callback ignores a return path for another portal', () => {
  const result = callbackResult({ user: { id: 'test' }, role: 'patient', loading: false }, '/app/admin/users');
  assert.equal(result.props.to, '/app/patient');
});

test('Google callback keeps pending professional access on the verification screen', () => {
  const result = callbackResult({ user: { id: 'test' }, role: 'patient', pendingProfessionalRole: 'doctor', loading: false });
  assert.equal(result.props.to, '/role-setup');
});

for (const security of [{mfaRequired:true},{mfaError:'Security check unavailable'}]) {
  test(`Google callback prioritizes second-factor protection over an unreadable profile: ${Object.keys(security)[0]}`,()=>{
    const result=callbackResult({user:{id:'test'},role:null,loading:false,...security},'/app/admin/health');
    assert.equal(result.type,Navigate);
    assert.equal(result.props.to,'/two-factor');
    assert.equal(result.props.state.from,'/app/admin/health');
  });
  test(`workspace verification cannot strand a second-factor sign-in: ${Object.keys(security)[0]}`,()=>{
    const state={from:'/app/admin/health'};
    const localLoad=moduleLoader({
      '../../providers/AuthProvider':{useAuth:()=>({user:{id:'test'},role:null,loading:false,...security})},
      'react-router-dom':{Navigate,useNavigate:()=>()=>{},useLocation:()=>({state})},
    });
    const result=localLoad('src/pages/auth/RoleSetupPage.tsx').default();
    assert.equal(result.type,Navigate);
    assert.equal(result.props.to,'/two-factor');
    assert.deepEqual(result.props.state,state);
  });
}

test('second-factor challenge precedes pending professional role checks after Google sign-in',()=>{
  const result=callbackResult({user:{id:'test'},role:null,loading:false,mfaRequired:true,pendingProfessionalRole:'doctor'});
  assert.equal(result.props.to,'/two-factor');
});

test('cancelled Google login displays recovery instead of routing into a workspace', () => {
  const result = callbackResult({ user: null, loading: false }, undefined, '?error=access_denied');
  assert.notEqual(result.type, Navigate);
  assert.equal(result.props.title, 'Let’s try that again.');
});

test('a Google return to the site root is recovered before rendering the public homepage', () => {
  const localLoad = moduleLoader({
    '../../lib/authRedirect': { readGoogleSignIn: () => ({ origin: 'https://wellnest-healthcare.vercel.app' }), authReturnOnPageLoad: false, hasAuthReturnParameters: () => false },
    'react-router-dom': { Navigate, useLocation: () => ({ pathname: '/', search: '', hash: '' }) },
  });
  const result = localLoad('src/components/auth/AuthReturnRecovery.tsx').AuthReturnRecovery({ children: 'public-homepage' });
  assert.equal(result.type, Navigate);
  assert.equal(result.props.to.pathname, '/auth/callback');
});

test('an ordinary homepage visit still renders the redesigned public homepage', () => {
  const localLoad = moduleLoader({
    '../../lib/authRedirect': { readGoogleSignIn: () => null, authReturnOnPageLoad: false, hasAuthReturnParameters: () => false },
    'react-router-dom': { Navigate, useLocation: () => ({ pathname: '/', search: '', hash: '' }) },
  });
  assert.equal(localLoad('src/components/auth/AuthReturnRecovery.tsx').AuthReturnRecovery({ children: 'public-homepage' }), 'public-homepage');
});

test('a record share uses the first displayed active recipient without requiring a redundant selection', async()=>{
  const originalWindow=globalThis.window;let sent;
  globalThis.window={location:{origin:'https://test.example'}};
  try{
    const localLoad=moduleLoader({
      react:{...require('react'),useState:initial=>[initial,()=>{}]},
      'react-router-dom':{useParams:()=>({recordId:'test-record'}),Link:()=>null},
      '../../providers/AuthProvider':{useAuth:()=>({session:{access_token:'fixture'}})},
      '../../providers/ToastProvider':{useToast:()=>({push:()=>{}})},
      '../../hooks/useAuthenticatedApi':{useAuthenticatedApi:endpoint=>({data:endpoint.startsWith('/api/records')?{id:'test-record',title:'TEST',category:'visit',source:'unknown',status:'issued',date:'2026-11-04'}:[{id:42,status:'active',requester_name:'Test doctor',organization:'Test clinic'}]})},
      '../../utils/apiFetch':{safeApiFetch:async(endpoint,options)=>{sent={endpoint,body:JSON.parse(options.body)};return {ok:true,data:{shareId:'test-share',expiresAt:'2027-01-01'}};}},
    });
    const page=localLoad('src/pages/patient/RecordDetailPage.tsx').default();
    const find=node=>{if(!node||typeof node!=='object')return null;if(node.props?.children==='Create Secure Recipient Link')return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child);if(found)return found;}return null;};
    const button=find(page);assert.ok(button,'share button is rendered');await button.props.onClick();
    assert.deepEqual(sent,{endpoint:'/api/record-share',body:{recordId:'test-record',grantId:42}});
  }finally{globalThis.window=originalWindow;}
});

test('starting Google sign-in uses the current build callback and remembers only a safe workspace destination', async () => {
  const originalWindow = globalThis.window;
  const storage = new Map();
  let request;
  globalThis.window = {
    location: { origin: 'http://127.0.0.1:5174', search: '', hash: '' },
    sessionStorage: { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key) },
  };
  try {
    const localLoad = moduleLoader({ './supabase': { __esModule: true, default: { auth: { signInWithOAuth: async value => { request = value; return { data: { provider: 'google' }, error: null }; } } } } });
    await localLoad('src/lib/googleAuth.ts').signInWithGoogle('/app/doctor/appointments');
    assert.equal(request.provider, 'google');
    assert.equal(request.options.redirectTo, 'http://127.0.0.1:5174/auth/callback');
    const intent = JSON.parse([...storage.values()][0]);
    assert.equal(intent.from, '/app/doctor/appointments');
    assert.equal(Object.hasOwn(intent, 'role'), false);
  } finally { globalThis.window = originalWindow; }
});
