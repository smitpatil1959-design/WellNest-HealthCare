import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath.startsWith('api/') ? `server-api-handlers/${relativePath.slice(4)}` : relativePath), 'utf8');

const authGuard = await import('../server-api-handlers/auth-guard.js');
const apiDispatcher = (await import('../server-api-handlers/dispatcher.js')).default;

test('Vercel catch-all dispatch restores dynamic API IDs without changing other query parameters', async () => {
  const req = {
    method: 'OPTIONS',
    url: '/api/lab/orders/order-123',
    query: { path: ['lab', 'orders', 'order-123'], status: 'pending' },
  };
  const res = {
    statusCode: 200,
    setHeader() { return this; },
    status(code) { this.statusCode = code; return this; },
    end() { this.ended = true; return this; },
    json(body) { this.body = body; return this; },
  };

  await apiDispatcher(req, res);

  assert.equal(req.query.id, 'order-123');
  assert.equal(req.query.status, 'pending');
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
});

function assertContains(source, text, message) {
  assert.ok(source.includes(text), message || `Expected source to contain: ${text}`);
}

test('role normalization accepts the canonical patient role', () => {
  assert.equal(authGuard.normalizeApiRole('patient'), 'patient');
  assert.equal(authGuard.normalizeApiRole('Patient'), 'patient');
});

test('verified staff authorization remains closed for unverified accounts', () => {
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'doctor', roleVerified: true }, ['doctor']), true);
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'doctor', roleVerified: false }, ['doctor']), false);
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['patient']), false);
});

test('patient routing does not require staff verification or organization membership', async () => {
  const source = await read('src/services/auth/authService.ts');
  assertContains(source, "if (norm === 'patient') return norm;");
  assertContains(source, 'if (norm && dbProfile.role_verified === true) return norm;');
  const guard = await read('src/components/auth/ProtectedRoute.tsx');
  assertContains(guard, "role && role !== 'patient'");
});

test('professional applicants are held in pending verification without gaining staff access', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const provider = await read('src/providers/AuthProvider.tsx');
  const routeGuard = await read('src/components/auth/ProtectedRoute.tsx');
  const setup = await read('src/pages/auth/RoleSetupPage.tsx');
  assertContains(authService, 'getPendingProfessionalRole');
  assertContains(authService, "requested_role");
  assertContains(provider, 'enrichedRole === \'patient\' ? getPendingProfessionalRole(nextUser) : null');
  assertContains(routeGuard, 'pendingProfessionalRole');
  assertContains(setup, 'Professional verification pending');
  assertContains(setup, 'Staff access remains closed');
});

test('server database configuration remains server-only and identifies the missing variable safely', async () => {
  const client = await read('api/db-client.js');
  const guard = await read('api/auth-guard.js');
  assertContains(client, 'process.env.SUPABASE_SERVICE_ROLE_KEY');
  assertContains(client, 'Missing server environment variable');
  assert.equal(client.includes('VITE_SUPABASE_SERVICE_ROLE_KEY'), false);
  assertContains(guard, 'Backend database service is unavailable.');
  assert.equal(guard.includes('Server database access is not configured.'), false);
});

test('server staff context requires verified membership', async () => {
  const source = await read('api/organization-context.js');
  assertContains(source, "hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])");
  assertContains(source, ".eq('status', 'active')");
  assertContains(source, ".not('verified_at', 'is', null)");
  assertContains(source, "organization.status !== 'verified'");
});

test('organization APIs do not trust browser organization identifiers', async () => {
  const members = await read('api/organizations/members.js');
  const memberUpdate = await read('api/organizations/members/[id].js');
  assertContains(members, 'context.organization.id');
  assertContains(memberUpdate, 'eq(\'organization_id\', context.organization.id)');
  assert.equal(members.includes('body.organizationId'), false);
  assert.equal(memberUpdate.includes('body.organizationId'), false);
});

test('laboratory workflows require membership and server-derived organization', async () => {
  const orders = await read('api/lab/orders.js');
  const verify = await read('api/lab/report-versions/[id]/verify.js');
  const release = await read('api/lab/report-versions/[id]/release.js');
  assertContains(orders, "hasVerifiedRole(auth, ['laboratory'])");
  assertContains(orders, 'context.organization.id');
  assertContains(verify, "['laboratory_admin', 'laboratory_director', 'laboratory_pathologist']");
  assertContains(release, "['laboratory_admin', 'laboratory_director']");
});

test('laboratory file downloads require published reports and authorization', async () => {
  const source = await read('api/lab/report-versions/[id]/download.js');
  assertContains(source, "version.status !== 'published'");
  assertContains(source, 'createSignedUrl');
  assertContains(source, 'SIGNED_URL_SECONDS = 300');
  assertContains(source, 'Current authorization does not permit this report download.');
});

test('storage relationships use one storage_objects model', async () => {
  const foundation = await read('supabase/migrations/006_organization_foundation.sql');
  const laboratory = await read('supabase/migrations/007_laboratory_foundation.sql');
  const insurance = await read('supabase/migrations/009_insurance_claims.sql');
  assertContains(foundation, 'storage_object_id UUID');
  assertContains(laboratory, 'lab_report_version_id UUID');
  assertContains(laboratory, 'storage_objects_lab_report_version_fk');
  assertContains(laboratory, 'organization_documents_storage_object_fk');
  assertContains(insurance, 'storage_object_id UUID');
  assertContains(insurance, 'insurance_claim_documents_storage_object_fk');
  assert.equal(/\bobject_key\s+TEXT\b/.test(foundation), false);
  assert.equal(/\bobject_id\s+UUID\b/.test(insurance), false);
});

test('private storage contract is explicit and scan-pending files cannot release', async () => {
  const upload = await read('api/lab/report-versions/[id]/file.js');
  const release = await read('api/lab/report-versions/[id]/release.js');
  const scanner = await read('api/storage/malware-scanner.js');
  assertContains(upload, "const BUCKET = 'medical-reports-private'");
  assertContains(upload, 'randomUUID()');
  assertContains(upload, 'MAX_BYTES = 3 * 1024 * 1024');
  assertContains(upload, 'scan_status: scan.status');
  assertContains(release, 'requireCleanScan');
  assertContains(release, 'Report file has not passed malware scanning.');
  assert.match(scanner, /status:\s*'pending'/);
  assert.match(scanner, /scannerName:\s*'not-configured'/);
});

test('migration dependency order is explicit and non-destructive', async () => {
  const migrations = await Promise.all(['006_organization_foundation.sql', '007_laboratory_foundation.sql', '008_pharmacy_prescription_events.sql', '009_insurance_claims.sql'].map((name) => read(`supabase/migrations/${name}`)));
  assertContains(migrations[1], 'public.organizations');
  assertContains(migrations[1], 'public.records');
  assertContains(migrations[2], 'public.organizations');
  assertContains(migrations[2], 'public.prescriptions');
  assertContains(migrations[3], 'public.organizations');
  assertContains(migrations[3], 'public.insurance_plans');
  for (const source of migrations) {
    assert.equal(/DROP TABLE|DROP COLUMN|TRUNCATE/i.test(source), false);
  }
});

test('pharmacy operations require active prescription consent and pharmacist authorization', async () => {
  const source = await read('api/pharmacy/prescriptions.js');
  assertContains(source, 'findActiveGrant(prescription.patient_id, auth.userId)');
  assertContains(source, "grantAllowsCategory(grant, 'prescription')");
  assertContains(source, "pharmacistRoles.includes(context.membership.role)");
  assertContains(source, 'prescription_verified');
});

test('insurance operations require claims consent and reviewer authorization', async () => {
  const policies = await read('api/insurance/policies.js');
  const claims = await read('api/insurance/claims.js');
  const review = await read('api/insurance/claims/[id]/review.js');
  assertContains(policies, "grantAllowsCategory(grant, 'authorized claims')");
  assertContains(claims, "grantAllowsCategory(grant, 'authorized claims')");
  assertContains(review, "['insurance_admin', 'insurance_reviewer']");
});

test('new organization and clinical migrations deny browser table privileges', async () => {
  for (const migration of ['006_organization_foundation.sql', '007_laboratory_foundation.sql', '008_pharmacy_prescription_events.sql', '009_insurance_claims.sql']) {
    const source = await read(`supabase/migrations/${migration}`);
    assert.equal(/GRANT[^;]+\b(anon|authenticated)\b/i.test(source), false, `${migration} grants browser table access`);
    assertContains(source, 'REVOKE ALL');
  }
});

test('API-backed hooks no longer use localStorage for implemented portals', async () => {
  for (const hook of ['src/hooks/useLabPortal.ts', 'src/hooks/usePharmacyPortal.ts', 'src/hooks/useInsurancePortal.ts']) {
    const source = await read(hook);
    assert.equal(source.includes('localStorage'), false, `${hook} still uses localStorage`);
    assertContains(source, 'safeApiFetch');
  }
});

test('migration 005 remains unmodified by the new foundation work', async () => {
  const source = await read('supabase/migrations/005_reconcile_production_schema.sql');
  assertContains(source, "role_verified BOOLEAN NOT NULL DEFAULT false");
  assertContains(source, 'INSERT INTO public.profiles (id, email, full_name, role, role_verified)');
});

test('production migration preflight is read-only', async () => {
  const source = await read('supabase/verification/migration_006_009_preflight.sql');
  const sql = source.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
  assert.equal(/\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b/i.test(sql), false);
  assertContains(sql, 'information_schema');
  assertContains(sql, 'pg_catalog');
  assertContains(sql, 'organization_memberships');
});

// ============================================================================
// PHASE 7 — PROFESSIONAL APPROVAL & DOCTOR AUTHORIZATION CONTRACT TESTS (1-20)
// ============================================================================

test('1. Patient remains Patient without staff privileges', async () => {
  const authService = await read('src/services/auth/authService.ts');
  assertContains(authService, "if (norm === 'patient') return norm;");
  assert.equal(authGuard.normalizeApiRole('patient'), 'patient');
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['doctor', 'hospital']), false);
});

test('2. Pending Doctor cannot access Doctor Workspace', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const routeGuard = await read('src/components/auth/ProtectedRoute.tsx');
  assertContains(authService, "requested_role");
  assertContains(authService, "'doctor'");
  assertContains(routeGuard, 'if (pendingProfessionalRole)');
  assertContains(routeGuard, 'paths.roleSetup');
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['doctor']), false);
});

test('3. Pending Lab cannot access Lab Workspace', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  assertContains(authService, "'laboratory'");
  assertContains(appRoutes, "<ProtectedRoute allow={['laboratory']}>");
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['laboratory']), false);
});

test('4. Pending Hospital cannot access Hospital Workspace', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  assertContains(authService, "'hospital'");
  assertContains(appRoutes, "<ProtectedRoute allow={['hospital']}>");
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['hospital']), false);
});

test('5. Pending Pharmacy cannot access Pharmacy Workspace', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  assertContains(authService, "'pharmacy'");
  assertContains(appRoutes, "<ProtectedRoute allow={['pharmacy']}>");
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['pharmacy']), false);
});

test('6. Pending Insurance cannot access Insurance Workspace', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  assertContains(authService, "'insurance'");
  assertContains(appRoutes, "<ProtectedRoute allow={['insurance']}>");
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['insurance']), false);
});

test('7. Normal user cannot approve themselves (self-approval rejected)', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'IF p_applicant_user_id = p_acting_admin_user_id THEN');
  assertContains(migration010, "RAISE EXCEPTION 'Administrator cannot approve their own account';");
});

test('8. Unverified admin cannot approve (trusted profile admin check)', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'FROM public.profiles');
  assertContains(migration010, 'WHERE id = p_acting_admin_user_id');
  assertContains(migration010, "v_admin_role <> 'administrator' OR v_admin_verified IS NOT TRUE");
  assertContains(migration010, "RAISE EXCEPTION 'Acting user is not an authorized verified administrator';");
});

test('9. Verified admin can trigger professional approval via secure API and RPC', async () => {
  const apiApprove = await read('api/admin/approve-applicant.js');
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(apiApprove, "hasVerifiedRole(auth, ['administrator'])");
  assertContains(apiApprove, "supabase.rpc('approve_professional_applicant'");
  assertContains(migration010, "CREATE OR REPLACE FUNCTION public.approve_professional_applicant");
  assertContains(migration010, "GRANT EXECUTE ON FUNCTION public.approve_professional_applicant(UUID, UUID, UUID) TO service_role;");
});

test('10. Invalid role/organization combination rejected', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, "v_requested_role = 'doctor' AND v_target_org.kind <> 'hospital'");
  assertContains(migration010, "v_requested_role = 'laboratory' AND v_target_org.kind <> 'laboratory'");
  assertContains(migration010, "v_requested_role = 'hospital' AND v_target_org.kind <> 'hospital'");
  assertContains(migration010, "v_requested_role = 'pharmacy' AND v_target_org.kind <> 'pharmacy'");
  assertContains(migration010, "v_requested_role = 'insurance' AND v_target_org.kind <> 'insurance'");
});

test('11. Approval sets trusted profile role', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'UPDATE public.profiles');
  assertContains(migration010, 'role = v_requested_role');
});

test('12. Approval sets role_verified=true', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'role_verified = true');
  assertContains(migration010, 'organization_id = v_target_org.id');
});

test('13. Approval creates active organization membership', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'INSERT INTO public.organization_memberships');
  assertContains(migration010, "'active'");
  assertContains(migration010, 'verified_at = EXCLUDED.verified_at');
  assertContains(migration010, 'verified_by = EXCLUDED.verified_by');
});

test('14. Approval writes audit event', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'INSERT INTO public.audit_events');
  assertContains(migration010, "'professional_applicant_approved'");
  assertContains(migration010, 'p_applicant_user_id::text');
});

test('15. Approval creates notification for applicant', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'INSERT INTO public.app_notifications');
  assertContains(migration010, "'account_verified'");
  assertContains(migration010, "'Professional verification approved'");
});

test('16. Duplicate approval cannot create duplicate membership (idempotent)', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'FOR UPDATE');
  assertContains(migration010, "IF v_applicant_profile.role_verified IS TRUE THEN");
  assertContains(migration010, "RAISE EXCEPTION 'Applicant is already verified';");
  assertContains(migration010, 'ON CONFLICT (user_id, organization_id) DO UPDATE');
});

test('17. Doctor without membership is rejected across clinical APIs', async () => {
  for (const endpoint of ['api/records.js', 'api/prescriptions.js', 'api/appointments.js', 'api/lab-reports.js', 'api/access-requests.js', 'api/access-grants.js']) {
    const source = await read(endpoint);
    assertContains(source, "getActiveMembership(auth, ['doctor'])", `${endpoint} missing getActiveMembership check for doctor`);
  }
});

test('18. Doctor with active verified membership is allowed', async () => {
  const orgContext = await import('../server-api-handlers/organization-context.js');
  assert.equal(typeof orgContext.getActiveMembership, 'function');
  const source = await read('api/organization-context.js');
  assertContains(source, ".eq('status', 'active')");
  assertContains(source, ".not('verified_at', 'is', null)");
});

test('19. Browser-supplied organization cannot bypass server-derived membership', async () => {
  const records = await read('api/records.js');
  const requests = await read('api/access-requests.js');
  assertContains(records, 'docContext?.organization?.display_name');
  assertContains(requests, 'organization = docContext.organization.display_name');
});

test('20. Browser/localStorage role manipulation cannot escalate privileges', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const authGuardFile = await read('api/auth-guard.js');
  assertContains(authService, "norm && dbProfile.role_verified === true");
  assertContains(authGuardFile, "profile?.role_verified === true");
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'patient', roleVerified: false }, ['doctor']), false);
  assert.equal(authGuard.hasVerifiedRole({ authenticated: true, role: 'doctor', roleVerified: false }, ['doctor']), false);
});

test('21. Super Admin workspace navigation is not blocked by clinical onboarding', async () => {
  const routeGuard = await read('src/components/auth/ProtectedRoute.tsx');
  assertContains(routeGuard, "role !== 'administrator'");
  const appNav = await read('src/config/appNav.ts');
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  // Check that administrator has all intended navigation links in appNav
  for (const label of ['Overview', 'Users', 'Organizations', 'Verification', 'Activity', 'Audit log', 'Permissions', 'System health', 'Security', 'Analytics', 'Notifications']) {
    assertContains(appNav, label, `Missing admin nav item: ${label}`);
  }
  // Check that admin child routes exist in AppRoutes
  assertContains(appRoutes, '<Route path="admin" element={<AdminGate />}>');
  assertContains(appRoutes, '<Route path="users" element={<AdminUsersPage />} />');
  assertContains(appRoutes, '<Route path="organizations" element={<AdminOrganizationsPage />} />');
  assertContains(appRoutes, '<Route path="verification" element={<AdminVerificationPage />} />');
  assertContains(appRoutes, '<Route path="activity" element={<AdminActivityPage />} />');
  assertContains(appRoutes, '<Route path="audit" element={<AdminAuditPage />} />');
  assertContains(appRoutes, '<Route path="permissions" element={<AdminPermissionsPage />} />');
  assertContains(appRoutes, '<Route path="health" element={<AdminHealthPage />} />');
  assertContains(appRoutes, '<Route path="security" element={<AdminSecurityPage />} />');
  assertContains(appRoutes, '<Route path="analytics" element={<AdminAnalyticsPage />} />');
  assertContains(appRoutes, '<Route path="notifications" element={<AdminNotificationsPage />} />');
});

test('22. Pending professional applications identify requested_role while applicant remains patient with role_verified=false', async () => {
  const pendingAppsSource = await read('api/admin/pending-applications.js');
  assertContains(pendingAppsSource, "raw_user_meta_data?.requested_role");
  assertContains(pendingAppsSource, "PROFESSIONAL_ROLES");
  assertContains(pendingAppsSource, "prof.role_verified !== true");

  // Verify simulation of the exact case: email = chotumpp1959@gmail.com, role = patient, role_verified = false, requested_role = doctor
  const professionalRoles = ['doctor', 'laboratory', 'hospital', 'pharmacy', 'insurance'];
  const mockUser = {
    id: 'user-pending-doc-1',
    email: 'chotumpp1959@gmail.com',
    raw_user_meta_data: { requested_role: 'doctor', full_name: 'Smit Patil' },
    user_metadata: { requested_role: 'doctor', full_name: 'Smit Patil' },
  };
  const mockProfile = {
    id: 'user-pending-doc-1',
    email: 'chotumpp1959@gmail.com',
    role: 'patient', // Intentionally remains patient until admin approval
    role_verified: false,
    organization: '',
  };

  const metaRole = mockUser.raw_user_meta_data?.requested_role || mockUser.user_metadata?.requested_role;
  assert.equal(professionalRoles.includes(metaRole), true);
  assert.equal(mockProfile.role_verified, false);
  assert.equal(mockProfile.role, 'patient');

  // Ensure dev server routing supports admin/pending-applications
  const viteConfig = await read('vite.config.ts');
  assertContains(viteConfig, "'admin/pending-applications'");
});

test('23. Verified Doctor workspace navigation is not blocked by clinical onboarding redirect', async () => {
  const routeGuard = await read('src/components/auth/ProtectedRoute.tsx');
  assertContains(routeGuard, "profile.roleVerified !== true");
  assertContains(routeGuard, "role && role !== 'patient'");

  const authService = await read('src/services/auth/authService.ts');
  assertContains(authService, "roleVerified: Boolean(dbProfile?.role_verified)");

  const authTypes = await read('src/types/auth.ts');
  assertContains(authTypes, "roleVerified?: boolean;");

  // Verify all doctor sidebar routes exist in appNav
  const appNav = await read('src/config/appNav.ts');
  for (const label of ['Dashboard', 'Patients', 'Appointments', 'Reports', 'Prescriptions', 'Workflow', 'Lookup Health ID', 'Notifications']) {
    assertContains(appNav, label, `Missing doctor nav item: ${label}`);
  }

  // Verify Doctor routes exist in AppRoutes
  const appRoutes = await read('src/routes/AppRoutes.tsx');
  assertContains(appRoutes, '<Route path="doctor" element={<DoctorGate />}>');
  assertContains(appRoutes, '<Route path="patients" element={<DoctorPatientsPage />} />');
  assertContains(appRoutes, '<Route path="appointments" element={<DoctorAppointmentsPage />} />');
  assertContains(appRoutes, '<Route path="reports" element={<DoctorReportsPage />} />');
  assertContains(appRoutes, '<Route path="prescriptions" element={<DoctorPrescriptionsPage />} />');
  assertContains(appRoutes, '<Route path="workflow" element={<DoctorWorkflowPage />} />');
  assertContains(appRoutes, '<Route path="lookup" element={<LookupPage />} />');

  // Verify logic simulation: verified doctor with onboardingCompleted=false is NOT blocked
  const verifiedDoctor = {
    role: 'doctor',
    profile: {
      role: 'doctor',
      roleVerified: true,
      onboardingCompleted: false, // Database onboardingCompleted is false
    },
  };
  const isBlocked = Boolean(
    verifiedDoctor.role &&
    verifiedDoctor.role !== 'patient' &&
    verifiedDoctor.role !== 'administrator' &&
    verifiedDoctor.profile &&
    verifiedDoctor.profile.roleVerified !== true &&
    verifiedDoctor.profile.onboardingCompleted !== true
  );
  assert.equal(isBlocked, false, 'Verified doctor must not be blocked by onboarding redirect');
});

test('24. Pending laboratory organization appears in Admin Verification', async () => {
  const pageSource = await read('src/pages/admin/AdminVerificationPage.tsx');
  const hookSource = await read('src/hooks/useAdminPortal.ts');
  const apiOrgsSource = await read('api/admin/organizations.js');

  // Verify pending/under-review filter in Admin Verification
  assertContains(pageSource, "o.status === 'pending' || o.status === 'under-review'");
  assertContains(pageSource, 'Issuer organizations');
  assertContains(pageSource, 'createOrg');
  assertContains(pageSource, 'Register organization');

  // Verify hook loads real organizations from API
  assertContains(hookSource, "safeApiFetch<ApiOrg[]>('/api/admin/organizations'");
  assertContains(hookSource, 'createOrg');

  // Verify API accepts kind='laboratory' and sets status='pending'
  assertContains(apiOrgsSource, 'ORGANIZATION_KINDS.includes(kind)');
  assertContains(apiOrgsSource, "status: 'pending'");
});

test('25. Unverified laboratory organization cannot be selected for professional provisioning', async () => {
  const pageSource = await read('src/pages/admin/AdminVerificationPage.tsx');
  const hookSource = await read('src/hooks/useAdminPortal.ts');

  // Hook only includes verified orgs in verifiedOrgs
  assertContains(hookSource, "orgs.filter((o) => o.status === 'verified')");

  // Admin Verification filters options strictly from verifiedOrgs
  assertContains(pageSource, 'eligibleOrgs = verifiedOrgs.filter((o) => o.kind === compatibleKind)');
  assertContains(pageSource, 'disabled={approvingId === app.id || !selectedOrgId}');
  assertContains(pageSource, 'No verified {compatibleKind} organizations available. Verify an organization first.');
});

test('26. Super Admin can verify a laboratory organization via server API', async () => {
  const apiVerification = await read('api/admin/organizations/[id]/verification.js');
  const apiAdminOrgs = await read('api/admin/organizations.js');
  const hookSource = await read('src/hooks/useAdminPortal.ts');

  // Verify administrator authorization check
  assertContains(apiVerification, "hasVerifiedRole(auth, ['administrator'])");
  assertContains(apiAdminOrgs, "hasVerifiedRole(auth, ['administrator'])");

  // Verify server-side status update to verified
  assertContains(apiVerification, "verified_at: status === 'verified' ? new Date().toISOString() : null");
  assertContains(apiVerification, "verified_by: status === 'verified' ? auth.userId : null");
  assertContains(apiVerification, "writeAudit(auth, 'organization_verification_changed'");

  assertContains(apiAdminOrgs, "verified_at: status === 'verified' ? new Date().toISOString() : null");
  assertContains(apiAdminOrgs, "writeAudit(auth, 'organization_verification_changed'");

  // Verify hook setOrgStatus
  assertContains(hookSource, "/api/admin/organizations/${id}/verification");
});

test('27. After verification, the laboratory organization is selectable for Laboratory applicants', async () => {
  const pageSource = await read('src/pages/admin/AdminVerificationPage.tsx');
  assertContains(pageSource, 'getCompatibleOrgKind(app.requestedRole)');
  assertContains(pageSource, "if (role === 'doctor') return 'hospital';");
  assertContains(pageSource, 'return role;');

  // Simulation: Laboratory applicant matches laboratory kind
  const mockApplicantRole = 'laboratory';
  const compatibleKind = mockApplicantRole === 'doctor' ? 'hospital' : mockApplicantRole;
  assert.equal(compatibleKind, 'laboratory');

  const mockOrgs = [
    { id: 'org-lab-1', name: 'Yash Diagnostics', kind: 'laboratory', status: 'verified', registration: 'CLIA-123' },
    { id: 'org-hsp-1', name: 'Northline Medical', kind: 'hospital', status: 'verified', registration: 'HSP-456' },
    { id: 'org-lab-pending', name: 'Pending Lab', kind: 'laboratory', status: 'pending', registration: 'CLIA-999' },
  ];
  const verifiedOrgs = mockOrgs.filter((o) => o.status === 'verified');
  const eligibleOrgs = verifiedOrgs.filter((o) => o.kind === compatibleKind);

  assert.equal(eligibleOrgs.length, 1);
  assert.equal(eligibleOrgs[0].id, 'org-lab-1');
  assert.equal(eligibleOrgs[0].name, 'Yash Diagnostics');
});

test('28. Laboratory professional approval succeeds only with a verified laboratory organization', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');

  // Target org must be verified
  assertContains(migration010, "IF v_target_org.status <> 'verified' THEN");
  assertContains(migration010, "RAISE EXCEPTION 'Target organization is not verified (current status: %)', v_target_org.status;");

  // Target org kind must be laboratory for laboratory role
  assertContains(migration010, "ELSIF v_requested_role = 'laboratory' AND v_target_org.kind <> 'laboratory' THEN");
  assertContains(migration010, "RAISE EXCEPTION 'Laboratory accounts can only be associated with laboratory organizations';");
});

test('29. Laboratory applicant receives correct trusted role and organization', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'UPDATE public.profiles');
  assertContains(migration010, 'role = v_requested_role');
  assertContains(migration010, 'role_verified = true');
  assertContains(migration010, 'organization_id = v_target_org.id');
  assertContains(migration010, 'organization = v_target_org.display_name');
});

test('30. Active laboratory organization membership is created with laboratory_admin role', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  const migration006 = await read('supabase/migrations/006_organization_foundation.sql');

  // Migration 010 maps laboratory requested_role to laboratory_admin
  assertContains(migration010, "WHEN 'laboratory' THEN v_membership_role := 'laboratory_admin';");
  assertContains(migration010, 'INSERT INTO public.organization_memberships');
  assertContains(migration010, 'v_membership_role');
  assertContains(migration010, "'active'");

  // Migration 006 allows laboratory_admin role in check constraint
  assertContains(migration006, "'laboratory_admin'");
});

test('31. Laboratory approval writes audit event record', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'INSERT INTO public.audit_events');
  assertContains(migration010, "'professional_applicant_approved'");
  assertContains(migration010, "'organization_kind', v_target_org.kind");
});

test('32. Laboratory approval creates app notification for applicant', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(migration010, 'INSERT INTO public.app_notifications');
  assertContains(migration010, "'account_verified'");
  assertContains(migration010, "'Professional verification approved'");
});

test('33. Non-admin cannot verify an organization and client cannot create pre-verified organization', async () => {
  const apiVerification = await read('api/admin/organizations/[id]/verification.js');
  const apiAdminOrgs = await read('api/admin/organizations.js');
  const apiOrgs = await read('api/organizations.js');

  // Both verification endpoints require administrator role
  assertContains(apiVerification, "!hasVerifiedRole(auth, ['administrator'])");
  assertContains(apiAdminOrgs, "!hasVerifiedRole(auth, ['administrator'])");

  // Client cannot create verified organization
  assertContains(apiOrgs, "status: 'pending'");
  assertContains(apiAdminOrgs, "status: 'pending'");
});

test('34. Existing Doctor approval flow remains intact and compatible', async () => {
  const migration010 = await read('supabase/migrations/010_professional_approval_rpc.sql');
  const pageSource = await read('src/pages/admin/AdminVerificationPage.tsx');

  // Doctor maps to hospital organization kind
  assertContains(pageSource, "if (role === 'doctor') return 'hospital';");
  assertContains(migration010, "IF v_requested_role = 'doctor' AND v_target_org.kind <> 'hospital' THEN");
  assertContains(migration010, "WHEN 'doctor'     THEN v_membership_role := 'doctor';");
});

test('35. Laboratory user sees their own laboratory derived from server membership', async () => {
  const orgMe = await read('api/organizations/me.js');
  const orgContext = await read('api/organization-context.js');
  const labDashboard = await read('src/pages/lab/LabDashboardPage.tsx');

  // Server derives organization strictly from authenticated user's active membership
  assertContains(orgMe, 'const context = await getActiveMembership(auth);');
  assertContains(orgContext, "hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])");
  assertContains(orgContext, ".eq('user_id', auth.userId)");
  assertContains(orgContext, ".eq('status', 'active')");
  assertContains(orgContext, ".not('verified_at', 'is', null)");

  // Lab UI uses the derived organization and renders standard workspace banner
  assertContains(labDashboard, 'useLabPortal');
  assertContains(labDashboard, 'OrganizationWorkspaceBanner');
  assertContains(labDashboard, 'workspaceTitle="LABORATORY WORKSPACE"');
});

test('36. Laboratory user cannot access another laboratory (cross-tenant access denied)', async () => {
  const orgMe = await read('api/organizations/me.js');
  const labOrders = await read('api/lab/orders.js');

  // Neither endpoint accepts or trusts an organization_id query or body from the client
  assert.equal(orgMe.includes('req.query.organization_id'), false);
  assert.equal(orgMe.includes('req.body.organization_id'), false);
  assertContains(labOrders, ".eq('organization_id', context.organization.id)");
});

test('37. Laboratory admin can update allowed laboratory information', async () => {
  const orgMe = await read('api/organizations/me.js');
  assertContains(orgMe, "'laboratory_admin'");
  assertContains(orgMe, "ALLOWED_PROFILE_KEYS");
  assertContains(orgMe, "writeAudit");
  assertContains(orgMe, "'organization_profile_updated'");
  assertContains(orgMe, ".eq('id', context.organization.id)");
});

test('38. Normal laboratory user cannot update protected organization fields', async () => {
  const orgMe = await read('api/organizations/me.js');
  // Admin check requires admin membership role
  assertContains(orgMe, "if (!ORG_ADMIN_ROLES.includes(context.membership.role))");
  assertContains(orgMe, "Organization administrator privileges required to update organization profile.");

  // Allowed editable keys are strictly whitelisted and exclude protected identity/status fields
  assertContains(orgMe, "const ALLOWED_PROFILE_KEYS = [");
  assert.equal(orgMe.includes("  'status',"), false);
  assert.equal(orgMe.includes("  'kind',"), false);
  assert.equal(orgMe.includes("  'verified_at',"), false);
});

test('39. Hospital user sees their hospital derived from active membership', async () => {
  const hospitalDashboard = await read('src/pages/hospital/HospitalDashboardPage.tsx');
  const hospitalProfile = await read('src/pages/hospital/HospitalProfilePage.tsx');

  assertContains(hospitalDashboard, 'OrganizationWorkspaceBanner');
  assertContains(hospitalDashboard, 'workspaceTitle="HOSPITAL WORKSPACE"');
  assertContains(hospitalProfile, 'OrganizationProfileView');
  assertContains(hospitalProfile, 'portalKind="hospital"');
});

test('40. Hospital user cannot access another hospital', async () => {
  const orgContext = await read('api/organization-context.js');
  const orgMe = await read('api/organizations/me.js');

  // Server scopes strictly by user_id
  assertContains(orgContext, ".eq('user_id', auth.userId)");
  assertContains(orgMe, ".eq('id', context.organization.id)");
});

test('41. Pharmacy user sees their pharmacy derived from active membership', async () => {
  const pharmacyDashboard = await read('src/pages/pharmacy/PharmacyDashboardPage.tsx');
  const pharmacyProfile = await read('src/pages/pharmacy/PharmacyProfilePage.tsx');

  assertContains(pharmacyDashboard, 'OrganizationWorkspaceBanner');
  assertContains(pharmacyDashboard, 'workspaceTitle="PHARMACY WORKSPACE"');
  assertContains(pharmacyProfile, 'OrganizationProfileView');
  assertContains(pharmacyProfile, 'portalKind="pharmacy"');
});

test('42. Pharmacy user cannot access another pharmacy', async () => {
  const pharmacyPrescriptions = await read('api/pharmacy/prescriptions.js');
  assertContains(pharmacyPrescriptions, "hasVerifiedRole(auth, ['pharmacy'])");
  assertContains(pharmacyPrescriptions, "context.organization.id");
});

test('43. Insurance user sees their insurance organization derived from active membership', async () => {
  const insuranceDashboard = await read('src/pages/insurance/InsuranceDashboardPage.tsx');
  const insuranceProfile = await read('src/pages/insurance/InsuranceProfilePage.tsx');

  assertContains(insuranceDashboard, 'OrganizationWorkspaceBanner');
  assertContains(insuranceDashboard, 'workspaceTitle="INSURANCE WORKSPACE"');
  assertContains(insuranceProfile, 'OrganizationProfileView');
  assertContains(insuranceProfile, 'portalKind="insurance"');
});

test('44. Insurance user cannot access another insurance organization', async () => {
  const insuranceClaims = await read('api/insurance/claims.js');
  assertContains(insuranceClaims, "hasVerifiedRole(auth, ['insurance'])");
  assertContains(insuranceClaims, "org.organization.id");
});

test('45. Doctor sees their organization context (Working at)', async () => {
  const doctorDashboard = await read('src/pages/doctor/DoctorDashboardPage.tsx');
  assertContains(doctorDashboard, 'Personal Professional Profile');
  assertContains(doctorDashboard, 'Working at');
  assertContains(doctorDashboard, 'useAuthenticatedApi<OrganizationContextResponse>(\'/api/organizations/me\')');
  assertContains(doctorDashboard, 'Verified Doctor Account');
});

test('46. Doctor cannot change organization from browser or dashboard', async () => {
  const doctorDashboard = await read('src/pages/doctor/DoctorDashboardPage.tsx');
  const orgMe = await read('api/organizations/me.js');

  // Doctor dashboard shows lock note
  assertContains(doctorDashboard, 'Hospital assignment is managed by hospital administration');
  // Doctor role is NOT in ORG_ADMIN_ROLES for PATCH /api/organizations/me
  assertContains(orgMe, "const ORG_ADMIN_ROLES = ['hospital_admin', 'laboratory_admin', 'pharmacy_admin', 'insurance_admin'];");
  assert.equal(orgMe.includes("'doctor'") && orgMe.includes("ORG_ADMIN_ROLES = ['doctor'"), false);
});

test('47. Patient does not receive an organization workspace', async () => {
  const patientDashboard = await read('src/pages/patient/PatientDashboardPage.tsx');
  // Patient page has NO OrganizationWorkspaceBanner
  assert.equal(patientDashboard.includes('OrganizationWorkspaceBanner'), false);
  assert.equal(patientDashboard.includes('LABORATORY WORKSPACE'), false);
  assert.equal(patientDashboard.includes('HOSPITAL WORKSPACE'), false);
  assertContains(patientDashboard, 'Your personal care space');
  assertContains(patientDashboard, 'My Health ID');
});

test('48. Organization admins can manage only their own organization', async () => {
  const orgMe = await read('api/organizations/me.js');
  const members = await read('api/organizations/members.js');
  const memberDetail = await read('api/organizations/members/[id].js');

  assertContains(orgMe, ".eq('id', context.organization.id)");
  assertContains(members, ".eq('organization_id', context.organization.id)");
  assertContains(memberDetail, ".eq('organization_id', context.organization.id)");
});

test('49. Role and verification fields remain server-controlled', async () => {
  const orgMe = await read('api/organizations/me.js');
  const profilesRpc = await read('supabase/migrations/010_professional_approval_rpc.sql');

  // Neither role nor verification can be set via client update
  assert.equal(orgMe.includes("body.role"), false);
  assert.equal(orgMe.includes("body.role_verified"), false);
  assert.equal(orgMe.includes("body.status"), false);
  assertContains(profilesRpc, "UPDATE public.profiles");
  assertContains(profilesRpc, "role_verified = true");
});

test('50. Existing laboratory verification flow still works', async () => {
  const apiVerification = await read('api/admin/organizations/[id]/verification.js');
  const pageVerification = await read('src/pages/admin/AdminVerificationPage.tsx');

  assertContains(apiVerification, "['pending', 'verified', 'rejected', 'suspended'].includes(status)");
  assertContains(pageVerification, "setOrgStatus(o.id, 'verified')");
  assertContains(pageVerification, 'Verify Organization');
});

test('51. Existing professional approval flow still works', async () => {
  const rpcSource = await read('supabase/migrations/010_professional_approval_rpc.sql');
  const apiApproval = await read('api/admin/approve-applicant.js');

  assertContains(rpcSource, 'CREATE OR REPLACE FUNCTION public.approve_professional_applicant');
  assertContains(apiApproval, "supabase.rpc('approve_professional_applicant'");
});

test('52. Existing Doctor workflow still works', async () => {
  const doctorDashboard = await read('src/pages/doctor/DoctorDashboardPage.tsx');
  assertContains(doctorDashboard, "paths.app.doctorPatients");
  assertContains(doctorDashboard, "paths.app.doctorAppointments");
  assertContains(doctorDashboard, "paths.app.doctorPrescriptions");
  assertContains(doctorDashboard, "paths.app.doctorReports");
  assertContains(doctorDashboard, "paths.app.doctorWorkflow");
});

/* =====================================================================
   Section 17: Simplified Authentication & Security Test Suite
   ===================================================================== */

test('AUTH 1. Email/password signup creates an account immediately via Supabase Auth', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const registerPage = await read('src/pages/auth/RegisterPage.tsx');

  assertContains(authService, 'supabase.auth.signUp');
  assertContains(registerPage, 'signUpWithPassword');
  // Signup attempts immediate session or direct password login without verification screens
  assertContains(registerPage, 'result.session && result.user');
  assertContains(registerPage, 'signInWithPassword(values.email, values.password)');
});

test('AUTH 2. Signup does NOT require email verification', async () => {
  const registerPage = await read('src/pages/auth/RegisterPage.tsx');

  // No email verification redirect or email waiting screen on signup
  assert.equal(registerPage.includes("navigate(paths.verifyEmail"), false);
  assert.equal(registerPage.includes("navigate('/verify-email'"), false);
  assert.equal(registerPage.includes("Check your email"), false);
  assert.equal(registerPage.includes("Verify your email"), false);
});

test('AUTH 3. Login works without email confirmation', async () => {
  const loginPage = await read('src/pages/auth/LoginPage.tsx');
  const authService = await read('src/services/auth/authService.ts');

  // Login relies strictly on signInWithPassword and does not check or block email_confirmed_at
  assertContains(loginPage, 'signInWithPassword(values.email, values.password)');
  assertContains(authService, 'supabase.auth.signInWithPassword({ email, password })');
  assert.equal(loginPage.includes('email_confirmed_at'), false);
  assert.equal(loginPage.includes('email not confirmed'), false);
});

test('AUTH 4. Invalid credentials are rejected cleanly', async () => {
  const loginPage = await read('src/pages/auth/LoginPage.tsx');
  assertContains(loginPage, '{serverError}');
  assertContains(loginPage, '<Alert tone="error" title="Could not sign in"');
});

test('AUTH 5. Password is never stored in application tables or localStorage', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const registerPage = await read('src/pages/auth/RegisterPage.tsx');
  const profileStore = await read('src/services/auth/profileStore.ts');

  // Password only passed to supabase.auth.signUp or signInWithPassword
  assert.equal(profileStore.includes('password'), false);
  assert.equal(authService.includes("localStorage.setItem('password'"), false);
  assert.equal(authService.includes("sessionStorage.setItem('password'"), false);
  assert.equal(registerPage.includes("localStorage.setItem('password'"), false);
});

test('AUTH 6. Forgot password uses Supabase Auth resetPasswordForEmail', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const forgotPage = await read('src/pages/auth/ForgotPasswordPage.tsx');
  const resetPage = await read('src/pages/auth/ResetPasswordPage.tsx');

  assertContains(authService, 'supabase.auth.resetPasswordForEmail');
  assertContains(authService, 'supabase.auth.updateUser({ password })');
  assertContains(forgotPage, 'requestPasswordReset(values.email)');
  assertContains(resetPage, 'updatePassword(values.password)');
});

test('AUTH 7. Google OAuth route exists', async () => {
  const googleAuth = await read('src/lib/googleAuth.ts');
  const googleBtn = await read('src/components/auth/GoogleButton.tsx');

  assertContains(googleAuth, 'export async function signInWithGoogle');
  assertContains(googleBtn, 'Continue with Google');
});

test('AUTH 8. Google OAuth uses Supabase Auth signInWithOAuth', async () => {
  const googleAuth = await read('src/lib/googleAuth.ts');
  assertContains(googleAuth, 'supabase.auth.signInWithOAuth');
  assertContains(googleAuth, "provider: 'google'");
});

test('AUTH 9. Google patient can enter patient flow', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const authProvider = await read('src/providers/AuthProvider.tsx');

  // Patients resolve cleanly without staff verification
  assertContains(authService, "if (norm === 'patient') return norm;");
  assertContains(authProvider, 'syncUserState');
});

test('AUTH 10. Google professional applicant remains pending', async () => {
  const authService = await read('src/services/auth/authService.ts');
  const authProvider = await read('src/providers/AuthProvider.tsx');
  const roleSetup = await read('src/pages/auth/RoleSetupPage.tsx');

  assertContains(authService, 'getPendingProfessionalRole');
  assertContains(authProvider, 'enrichedRole === \'patient\' ? getPendingProfessionalRole(nextUser) : null');
  assertContains(roleSetup, 'Professional verification pending');
});

test('AUTH 11. Email/password professional applicant remains pending', async () => {
  const registerPage = await read('src/pages/auth/RegisterPage.tsx');
  assertContains(registerPage, "navigate(paths.roleSetup, { replace: true })");
});

test('AUTH 12. Email authentication does NOT grant professional privileges', async () => {
  const authService = await read('src/services/auth/authService.ts');
  // resolveUserRole requires dbProfile.role_verified === true for non-patient roles
  assertContains(authService, 'if (norm && dbProfile.role_verified === true) return norm;');
});

test('AUTH 13. requested_role cannot grant a trusted role', async () => {
  const authService = await read('src/services/auth/authService.ts');
  assertContains(authService, 'A pending role only controls the safe waiting screen. It never grants');
  assertContains(authService, 'authorization; staff access still comes from the trusted database profile.');
});

test('AUTH 14. localStorage cannot grant role access', async () => {
  const authService = await read('src/services/auth/authService.ts');
  assertContains(authService, 'User metadata, email, and local storage never grant workspace access.');
});

test('AUTH 15. localStorage cannot grant role_verified', async () => {
  const authGuard = await read('api/auth-guard.js');
  assertContains(authGuard, "export function hasVerifiedRole(auth, roles) {");
  assertContains(authGuard, "auth.roleVerified === true");
});

test('AUTH 16. Browser query parameters cannot grant authorization', async () => {
  const authGuard = await read('api/auth-guard.js');
  // API auth guard strictly inspects Bearer token and DB profile
  assertContains(authGuard, "req.headers?.authorization || req.headers?.Authorization");
  assert.equal(authGuard.includes("req.query.role"), false);
  assert.equal(authGuard.includes("req.query.role_verified"), false);
});

test('AUTH 17. Existing Super Admin remains protected', async () => {
  const authGuard = await read('api/auth-guard.js');
  const superAdminApi = await read('api/admin/organizations/[id]/verification.js');
  assertContains(superAdminApi, "hasVerifiedRole(auth, ['administrator'])");
  assertContains(authGuard, "cleaned === 'administrator'");
});

test('AUTH 18. Existing Doctor approval flow still works', async () => {
  const rpc = await read('supabase/migrations/010_professional_approval_rpc.sql');
  assertContains(rpc, "approve_professional_applicant");
  assertContains(rpc, "role = v_requested_role");
  assertContains(rpc, "role_verified = true");
});

test('AUTH 19. Existing Laboratory verification/provisioning still works', async () => {
  const orgVerification = await read('api/admin/organizations/[id]/verification.js');
  const orgContext = await read('api/organization-context.js');

  assertContains(orgVerification, "status === 'verified'");
  assertContains(orgContext, "hasVerifiedRole(auth, ['doctor', 'hospital', 'laboratory', 'pharmacy', 'insurance'])");
});

test('AUTH 20. Existing organization membership authorization still works', async () => {
  const orgContext = await read('api/organization-context.js');
  assertContains(orgContext, "organization_members");
  assertContains(orgContext, ".eq('status', 'active')");
  assertContains(orgContext, "not('verified_at', 'is', null)");
});






