import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { OrganizationProfileView } from '../../components/organization/OrganizationProfileView';
import { useHospitalPortal } from '../../hooks/useHospitalPortal';
import { paths } from '../../routes/paths';

export default function HospitalProfilePage() {
  const { organization, memberCount, isOrgAdmin, staffRole, updateOrganization } = useHospitalPortal();

  const roleLabels: Record<string, string> = {
    admin: 'Hospital Administrator',
    doctor: 'Attending Physician',
    receptionist: 'Intake / Receptionist',
    nurse: 'Floor Nurse',
    laboratory: 'Hospital Lab Staff',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.hospital },
    { label: 'Patients', href: paths.app.hospitalPatients },
    { label: 'Physicians', href: paths.app.hospitalDoctors },
    { label: 'Departments', href: paths.app.hospitalDepartments },
    { label: 'Admissions', href: paths.app.hospitalAdmissions },
    { label: 'Reports', href: paths.app.hospitalReports },
    { label: 'Staff Roles', href: paths.app.hospitalStaff },
    { label: 'Hospital Profile', href: paths.app.hospitalProfile },
  ];

  const orgName = organization?.display_name || 'Hospital Profile';
  const legalName = organization?.legal_name || 'Organization Record';

  return (
    <>
      <Seo
        title={`${orgName} — Hospital Profile`}
        description="Verified hospital organization profile, departments, and clinical leadership."
      />
      <div className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="HOSPITAL WORKSPACE"
          userRoleLabel={roleLabels[staffRole] || staffRole}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.hospitalProfile}
        />

        <PatientPageHeader
          title={orgName}
          description={`${legalName} · Primary Hospital Facility & Operational Profile`}
        />

        <OrganizationProfileView
          org={organization}
          isOrgAdmin={isOrgAdmin}
          userRoleLabel={roleLabels[staffRole] || staffRole}
          memberCount={memberCount}
          portalKind="hospital"
          onSaveOrg={updateOrganization}
        />
      </div>
    </>
  );
}
