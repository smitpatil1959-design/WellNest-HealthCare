import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { OrganizationProfileView } from '../../components/organization/OrganizationProfileView';
import { useLabPortal } from '../../hooks/useLabPortal';
import { paths } from '../../routes/paths';

export default function LabProfilePage() {
  const { organization, memberCount, isOrgAdmin, role, updateOrganization } = useLabPortal();

  const roleLabels: Record<string, string> = {
    director: 'Laboratory Director (Administrator)',
    pathologist: 'Clinical Pathologist',
    technologist: 'Medical Technologist',
    receptionist: 'Lab Intake Staff',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.laboratory },
    { label: 'Orders & Tests', href: paths.app.labTests },
    { label: 'Compose Report', href: paths.app.labCompose },
    { label: 'Reports', href: paths.app.labReports },
    { label: 'Verify', href: paths.app.labVerify },
    { label: 'Staff Roles', href: paths.app.labStaff },
    { label: 'Organization Profile', href: paths.app.labProfile },
  ];

  const orgName = organization?.display_name || 'Laboratory Profile';
  const legalName = organization?.legal_name || 'Organization Record';

  return (
    <>
      <Seo
        title={`${orgName} — Laboratory Profile`}
        description="Verified laboratory organization profile, accreditation, and operational details."
      />
      <div className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="LABORATORY WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Laboratory Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.labProfile}
        />

        <PatientPageHeader
          title={orgName}
          description={`${legalName} · Primary Laboratory Identity & Operational Configuration`}
        />

        <OrganizationProfileView
          org={organization}
          isOrgAdmin={isOrgAdmin}
          userRoleLabel={role ? roleLabels[role] || role : 'Laboratory Staff'}
          memberCount={memberCount}
          portalKind="laboratory"
          onSaveOrg={updateOrganization}
        />
      </div>
    </>
  );
}
