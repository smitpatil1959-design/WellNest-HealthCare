import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { OrganizationProfileView } from '../../components/organization/OrganizationProfileView';
import { useInsurancePortal } from '../../hooks/useInsurancePortal';
import { paths } from '../../routes/paths';

export default function InsuranceProfilePage() {
  const { organization, memberCount, isOrgAdmin, role, updateOrganization } = useInsurancePortal();

  const roleLabels: Record<string, string> = {
    admin: 'Insurance Administrator',
    reviewer: 'Senior Claims Reviewer',
    'policy-manager': 'Policy & Benefits Manager',
    support: 'Member Support Representative',
    auditor: 'Compliance & Claims Auditor',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.insurance },
    { label: 'Policies', href: paths.app.insurancePolicies },
    { label: 'Claims', href: paths.app.insuranceClaims },
    { label: 'Review Queue', href: paths.app.insuranceReview },
    { label: 'Members', href: paths.app.insuranceMembers },
    { label: 'Staff Roles', href: paths.app.insuranceStaff },
    { label: 'Insurance Profile', href: paths.app.insuranceProfile },
  ];

  const orgName = organization?.display_name || 'Insurance Organization Profile';
  const legalName = organization?.legal_name || 'Insurance Entity Record';

  return (
    <>
      <Seo
        title={`${orgName} — Insurance Profile`}
        description="Verified health plan organization profile, policy underwriting limits, and contact information."
      />
      <div className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="INSURANCE WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Insurance Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.insuranceProfile}
        />

        <PatientPageHeader
          title={orgName}
          description={`${legalName} · Licensed Health Insurance Underwriter Record`}
        />

        <OrganizationProfileView
          org={organization}
          isOrgAdmin={isOrgAdmin}
          userRoleLabel={role ? roleLabels[role] || role : 'Insurance Staff'}
          memberCount={memberCount}
          portalKind="insurance"
          onSaveOrg={updateOrganization}
        />
      </div>
    </>
  );
}
