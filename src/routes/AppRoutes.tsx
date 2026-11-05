import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { MarketingLayout } from '../layouts/MarketingLayout';
import { AppLayout } from '../layouts/AppLayout';
import { Spinner } from '../components/ui/Spinner';
import { ErrorPage } from '../pages/ErrorPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { GuestRoute } from '../components/auth/GuestRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const FeaturesPage = lazy(() => import('../pages/FeaturesPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const SupportPage = lazy(() => import('../pages/app/SupportPage'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const AuthCallbackPage = lazy(() => import('../pages/auth/AuthCallbackPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));
const TwoFactorPage = lazy(() => import('../pages/auth/TwoFactorPage'));
const UnauthorizedPage = lazy(() => import('../pages/auth/UnauthorizedPage'));
const AccessDeniedPage = lazy(() => import('../pages/auth/AccessDeniedPage'));
const RoleSetupPage = lazy(() => import('../pages/auth/RoleSetupPage'));
const RolePage = lazy(() => import('../pages/RolePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const DesignSystemPage = lazy(() => import('../pages/DesignSystemPage'));
const WorkspacePlaceholderPage = lazy(() => import('../pages/app/WorkspacePlaceholderPage'));
const ProfilePage = lazy(() => import('../pages/app/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/app/SettingsPage'));
const SharedReportPage = lazy(() => import('../pages/app/SharedReportPage'));
const AppIndexPage = lazy(() => import('../pages/app/AppIndexPage'));
const PatientDashboardPage = lazy(() => import('../pages/patient/PatientDashboardPage'));
const RecordsPage = lazy(() => import('../pages/patient/RecordsPage'));
const RecordDetailPage = lazy(() => import('../pages/patient/RecordDetailPage'));
const LabsPage = lazy(() => import('../pages/patient/LabsPage'));
const PrescriptionsPage = lazy(() => import('../pages/patient/PrescriptionsPage'));
const AppointmentsPage = lazy(() => import('../pages/patient/AppointmentsPage'));
const DoctorsPage = lazy(() => import('../pages/patient/DoctorsPage'));
const HospitalsPage = lazy(() => import('../pages/patient/HospitalsPage'));
const MedicationsPage = lazy(() => import('../pages/patient/MedicationsPage'));
const VaccinationsPage = lazy(() => import('../pages/patient/VaccinationsPage'));
const InsurancePage = lazy(() => import('../pages/patient/InsurancePage'));
const TimelinePage = lazy(() => import('../pages/patient/TimelinePage'));
const NotificationsPage = lazy(() => import('../pages/patient/NotificationsPage'));
const EmergencyPage = lazy(() => import('../pages/patient/EmergencyPage'));
const HelpCenterPage = lazy(() => import('../pages/patient/HelpCenterPage'));
const HealthIdPage = lazy(() => import('../pages/patient/HealthIdPage'));
const AccessControlPage = lazy(() => import('../pages/patient/AccessControlPage'));
const AccessRequestsPage = lazy(() => import('../pages/patient/AccessRequestsPage'));
const AccessHistoryPage = lazy(() => import('../pages/patient/AccessHistoryPage'));
const LookupPage = lazy(() => import('../pages/app/LookupPage'));
const DoctorDashboardPage = lazy(() => import('../pages/doctor/DoctorDashboardPage'));
const DoctorPatientsPage = lazy(() => import('../pages/doctor/DoctorPatientsPage'));
const DoctorPatientProfilePage = lazy(() => import('../pages/doctor/DoctorPatientProfilePage'));
const ConsultationPage = lazy(() => import('../pages/doctor/ConsultationPage'));
const DoctorReportsPage = lazy(() => import('../pages/doctor/DoctorReportsPage'));
const DoctorPrescriptionsPage = lazy(() => import('../pages/doctor/DoctorPrescriptionsPage'));
const DoctorAppointmentsPage = lazy(() => import('../pages/doctor/DoctorAppointmentsPage'));
const DoctorNotificationsPage = lazy(() => import('../pages/doctor/DoctorNotificationsPage'));
const DoctorWorkflowPage = lazy(() => import('../pages/doctor/DoctorWorkflowPage'));
const HospitalDashboardPage = lazy(() => import('../pages/hospital/HospitalDashboardPage'));
const HospitalProfilePage = lazy(() => import('../pages/hospital/HospitalProfilePage'));
const HospitalPatientsPage = lazy(() => import('../pages/hospital/HospitalPatientsPage'));
const HospitalPatientChartPage = lazy(() => import('../pages/hospital/HospitalPatientChartPage'));
const HospitalRegisterPage = lazy(() => import('../pages/hospital/HospitalRegisterPage'));
const HospitalDoctorsPage = lazy(() => import('../pages/hospital/HospitalDoctorsPage'));
const HospitalDepartmentsPage = lazy(() => import('../pages/hospital/HospitalDepartmentsPage'));
const HospitalAppointmentsPage = lazy(() => import('../pages/hospital/HospitalAppointmentsPage'));
const HospitalAdmissionsPage = lazy(() => import('../pages/hospital/HospitalAdmissionsPage'));
const HospitalReportsPage = lazy(() => import('../pages/hospital/HospitalReportsPage'));
const HospitalRecordsPage = lazy(() => import('../pages/hospital/HospitalRecordsPage'));
const HospitalLabsPage = lazy(() => import('../pages/hospital/HospitalLabsPage'));
const HospitalDischargePage = lazy(() => import('../pages/hospital/HospitalDischargePage'));
const HospitalAnalyticsPage = lazy(() => import('../pages/hospital/HospitalAnalyticsPage'));
const HospitalNotificationsPage = lazy(() => import('../pages/hospital/HospitalNotificationsPage'));
const HospitalStaffPage = lazy(() => import('../pages/hospital/HospitalStaffPage'));
const LabDashboardPage = lazy(() => import('../pages/lab/LabDashboardPage'));
const LabProfilePage = lazy(() => import('../pages/lab/LabProfilePage'));
const LabTestsPage = lazy(() => import('../pages/lab/LabTestsPage'));
const LabTestDetailPage = lazy(() => import('../pages/lab/LabTestDetailPage'));
const LabReportsPage = lazy(() => import('../pages/lab/LabReportsPage'));
const LabReportViewerPage = lazy(() => import('../pages/lab/LabReportViewerPage'));
const LabComposePage = lazy(() => import('../pages/lab/LabComposePage'));
const LabVerifyPage = lazy(() => import('../pages/lab/LabVerifyPage'));
const LabCriticalPage = lazy(() => import('../pages/lab/LabCriticalPage'));
const LabPublishPage = lazy(() => import('../pages/lab/LabPublishPage'));
const LabAnalyticsPage = lazy(() => import('../pages/lab/LabAnalyticsPage'));
const LabNotificationsPage = lazy(() => import('../pages/lab/LabNotificationsPage'));
const LabStaffPage = lazy(() => import('../pages/lab/LabStaffPage'));
const PharmacyDashboardPage = lazy(() => import('../pages/pharmacy/PharmacyDashboardPage'));
const PharmacyProfilePage = lazy(() => import('../pages/pharmacy/PharmacyProfilePage'));
const PharmacyQueuePage = lazy(() => import('../pages/pharmacy/PharmacyQueuePage'));
const PharmacyRxViewerPage = lazy(() => import('../pages/pharmacy/PharmacyRxViewerPage'));
const PharmacyVerifyPage = lazy(() => import('../pages/pharmacy/PharmacyVerifyPage'));
const PharmacyInventoryPage = lazy(() => import('../pages/pharmacy/PharmacyInventoryPage'));
const PharmacyOrdersPage = lazy(() => import('../pages/pharmacy/PharmacyOrdersPage'));
const PharmacyConnectPage = lazy(() => import('../pages/pharmacy/PharmacyConnectPage'));
const PharmacyAnalyticsPage = lazy(() => import('../pages/pharmacy/PharmacyAnalyticsPage'));
const PharmacyNotificationsPage = lazy(() => import('../pages/pharmacy/PharmacyNotificationsPage'));
const PharmacyStaffPage = lazy(() => import('../pages/pharmacy/PharmacyStaffPage'));
const InsuranceDashboardPage = lazy(() => import('../pages/insurance/InsuranceDashboardPage'));
const InsurancePoliciesPage = lazy(() => import('../pages/insurance/InsurancePoliciesPage'));
const InsurancePolicyDetailPage = lazy(() => import('../pages/insurance/InsurancePolicyDetailPage'));
const InsuranceClaimsPage = lazy(() => import('../pages/insurance/InsuranceClaimsPage'));
const InsuranceClaimDetailPage = lazy(() => import('../pages/insurance/InsuranceClaimDetailPage'));
const InsuranceMembersPage = lazy(() => import('../pages/insurance/InsuranceMembersPage'));
const InsuranceMemberPage = lazy(() => import('../pages/insurance/InsuranceMemberPage'));
const InsuranceDocumentsPage = lazy(() => import('../pages/insurance/InsuranceDocumentsPage'));
const InsuranceReviewPage = lazy(() => import('../pages/insurance/InsuranceReviewPage'));
const InsuranceFraudPage = lazy(() => import('../pages/insurance/InsuranceFraudPage'));
const InsuranceAnalyticsPage = lazy(() => import('../pages/insurance/InsuranceAnalyticsPage'));
const InsuranceNotificationsPage = lazy(() => import('../pages/insurance/InsuranceNotificationsPage'));
const InsuranceStaffPage = lazy(() => import('../pages/insurance/InsuranceStaffPage'));
const InsuranceProfilePage = lazy(() => import('../pages/insurance/InsuranceProfilePage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('../pages/admin/AdminUserDetailPage'));
const AdminOrganizationsPage = lazy(() => import('../pages/admin/AdminOrganizationsPage'));
const AdminOrganizationDetailPage = lazy(() => import('../pages/admin/AdminOrganizationDetailPage'));
const AdminVerificationPage = lazy(() => import('../pages/admin/AdminVerificationPage'));
const AdminActivityPage = lazy(() => import('../pages/admin/AdminActivityPage'));
const AdminAuditPage = lazy(() => import('../pages/admin/AdminAuditPage'));
const AdminPermissionsPage = lazy(() => import('../pages/admin/AdminPermissionsPage'));
const AdminHealthPage = lazy(() => import('../pages/admin/AdminHealthPage'));
const AdminSecurityPage = lazy(() => import('../pages/admin/AdminSecurityPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminNotificationsPage = lazy(() => import('../pages/admin/AdminNotificationsPage'));
const VerifyHealthIdPage = lazy(() => import('../pages/public/VerifyHealthIdPage'));

function AdminGate() {
  return (
    <ProtectedRoute allow={['administrator']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function InsuranceGate() {
  return (
    <ProtectedRoute allow={['insurance']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function PharmacyGate() {
  return (
    <ProtectedRoute allow={['pharmacy']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function LabGate() {
  return (
    <ProtectedRoute allow={['laboratory']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function HospitalGate() {
  return (
    <ProtectedRoute allow={['hospital']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function DoctorGate() {
  return (
    <ProtectedRoute allow={['doctor']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function PatientGate() {
  return (
    <ProtectedRoute allow={['patient']}>
      <Outlet />
    </ProtectedRoute>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className="text-sm text-ink-400">Preparing a quieter view…</p>
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="two-factor" element={<TwoFactorPage />} />
          <Route path="design-system" element={<DesignSystemPage />} />
          <Route path="for/:role" element={<RolePage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />
          <Route path="role-setup" element={<RoleSetupPage />} />
          <Route path="verify/health-id/:healthId" element={<VerifyHealthIdPage />} />
          <Route path="error" element={<ErrorPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
        </Route>

        <Route
          path="app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppIndexPage />} />
          <Route path="patient" element={<PatientGate />}>
            <Route index element={<PatientDashboardPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="records/:recordId" element={<RecordDetailPage />} />
            <Route path="labs" element={<LabsPage />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="hospitals" element={<HospitalsPage />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route path="vaccinations" element={<VaccinationsPage />} />
            <Route path="insurance" element={<InsurancePage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="emergency" element={<EmergencyPage />} />
            <Route path="help" element={<HelpCenterPage />} />
            <Route path="health-id" element={<HealthIdPage />} />
            <Route path="access" element={<AccessControlPage />} />
            <Route path="requests" element={<AccessRequestsPage />} />
            <Route path="access-history" element={<AccessHistoryPage />} />
          </Route>
          <Route path="lookup" element={<LookupPage />} />
          <Route path="doctor" element={<DoctorGate />}>
            <Route index element={<DoctorDashboardPage />} />
            <Route path="patients" element={<DoctorPatientsPage />} />
            <Route path="patients/:grantId" element={<DoctorPatientProfilePage />} />
            <Route path="consult/:grantId" element={<ConsultationPage />} />
            <Route path="reports" element={<DoctorReportsPage />} />
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="notifications" element={<DoctorNotificationsPage />} />
            <Route path="workflow" element={<DoctorWorkflowPage />} />
          </Route>
          <Route path="hospital" element={<HospitalGate />}>
            <Route index element={<HospitalDashboardPage />} />
            <Route path="profile" element={<HospitalProfilePage />} />
            <Route path="patients" element={<HospitalPatientsPage />} />
            <Route path="patients/:patientId" element={<HospitalPatientChartPage />} />
            <Route path="register" element={<HospitalRegisterPage />} />
            <Route path="doctors" element={<HospitalDoctorsPage />} />
            <Route path="departments" element={<HospitalDepartmentsPage />} />
            <Route path="appointments" element={<HospitalAppointmentsPage />} />
            <Route path="admissions" element={<HospitalAdmissionsPage />} />
            <Route path="reports" element={<HospitalReportsPage />} />
            <Route path="records" element={<HospitalRecordsPage />} />
            <Route path="labs" element={<HospitalLabsPage />} />
            <Route path="discharge" element={<HospitalDischargePage />} />
            <Route path="analytics" element={<HospitalAnalyticsPage />} />
            <Route path="notifications" element={<HospitalNotificationsPage />} />
            <Route path="staff" element={<HospitalStaffPage />} />
          </Route>
          <Route path="laboratory" element={<LabGate />}>
            <Route index element={<LabDashboardPage />} />
            <Route path="profile" element={<LabProfilePage />} />
            <Route path="tests" element={<LabTestsPage />} />
            <Route path="tests/:testId" element={<LabTestDetailPage />} />
            <Route path="reports" element={<LabReportsPage />} />
            <Route path="reports/:reportId" element={<LabReportViewerPage />} />
            <Route path="compose" element={<LabComposePage />} />
            <Route path="verify" element={<LabVerifyPage />} />
            <Route path="critical" element={<LabCriticalPage />} />
            <Route path="publish" element={<LabPublishPage />} />
            <Route path="analytics" element={<LabAnalyticsPage />} />
            <Route path="notifications" element={<LabNotificationsPage />} />
            <Route path="staff" element={<LabStaffPage />} />
          </Route>
          <Route path="pharmacy" element={<PharmacyGate />}>
            <Route index element={<PharmacyDashboardPage />} />
            <Route path="profile" element={<PharmacyProfilePage />} />
            <Route path="queue" element={<PharmacyQueuePage />} />
            <Route path="prescriptions/:rxId" element={<PharmacyRxViewerPage />} />
            <Route path="verify" element={<PharmacyVerifyPage />} />
            <Route path="inventory" element={<PharmacyInventoryPage />} />
            <Route path="orders" element={<PharmacyOrdersPage />} />
            <Route path="connect" element={<PharmacyConnectPage />} />
            <Route path="analytics" element={<PharmacyAnalyticsPage />} />
            <Route path="notifications" element={<PharmacyNotificationsPage />} />
            <Route path="staff" element={<PharmacyStaffPage />} />
          </Route>
          <Route path="insurance" element={<InsuranceGate />}>
            <Route index element={<InsuranceDashboardPage />} />
            <Route path="policies" element={<InsurancePoliciesPage />} />
            <Route path="policies/:policyId" element={<InsurancePolicyDetailPage />} />
            <Route path="claims" element={<InsuranceClaimsPage />} />
            <Route path="claims/:claimId" element={<InsuranceClaimDetailPage />} />
            <Route path="members" element={<InsuranceMembersPage />} />
            <Route path="members/:memberId" element={<InsuranceMemberPage />} />
            <Route path="documents" element={<InsuranceDocumentsPage />} />
            <Route path="review" element={<InsuranceReviewPage />} />
            <Route path="fraud" element={<InsuranceFraudPage />} />
            <Route path="analytics" element={<InsuranceAnalyticsPage />} />
            <Route path="notifications" element={<InsuranceNotificationsPage />} />
            <Route path="staff" element={<InsuranceStaffPage />} />
            <Route path="profile" element={<InsuranceProfilePage />} />
          </Route>
          <Route path="admin" element={<AdminGate />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<AdminUserDetailPage />} />
            <Route path="organizations" element={<AdminOrganizationsPage />} />
            <Route path="organizations/:orgId" element={<AdminOrganizationDetailPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="permissions" element={<AdminPermissionsPage />} />
            <Route path="health" element={<AdminHealthPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
          </Route>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="shared-reports/:shareId" element={<SharedReportPage />} />
          <Route path=":section" element={<WorkspacePlaceholderPage />} />
        </Route>

        <Route element={<MarketingLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
