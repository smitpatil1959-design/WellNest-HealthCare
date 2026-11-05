import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { OrganizationWorkspaceBanner } from '../../components/organization/OrganizationWorkspaceBanner';
import { OrganizationProfileView } from '../../components/organization/OrganizationProfileView';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { paths } from '../../routes/paths';

export default function PharmacyProfilePage() {
  const { organization, memberCount, isOrgAdmin, role, updateOrganization } = usePharmacyPortal();

  const roleLabels: Record<string, string> = {
    'pharmacist-in-charge': 'Pharmacist-in-Charge (Admin)',
    pharmacist: 'Licensed Pharmacist',
    technician: 'Certified Pharmacy Technician',
    cashier: 'Pharmacy Cashier & Dispense Clerk',
  };

  const navLinks = [
    { label: 'Overview', href: paths.app.pharmacy },
    { label: 'Prescription Queue', href: paths.app.pharmacyQueue },
    { label: 'Verify', href: paths.app.pharmacyVerify },
    { label: 'Inventory', href: paths.app.pharmacyInventory },
    { label: 'Orders', href: paths.app.pharmacyOrders },
    { label: 'Staff Roles', href: paths.app.pharmacyStaff },
    { label: 'Pharmacy Profile', href: paths.app.pharmacyProfile },
  ];

  const orgName = organization?.display_name || 'Pharmacy Profile';
  const legalName = organization?.legal_name || 'Organization Record';

  return (
    <>
      <Seo
        title={`${orgName} — Pharmacy Profile`}
        description="Verified pharmacy organization profile, dispensing license, and operating schedule."
      />
      <div className="space-y-6">
        <OrganizationWorkspaceBanner
          org={organization}
          workspaceTitle="PHARMACY WORKSPACE"
          userRoleLabel={role ? roleLabels[role] || role : 'Pharmacy Staff'}
          memberCount={memberCount}
          navLinks={navLinks}
          profileLink={paths.app.pharmacyProfile}
        />

        <PatientPageHeader
          title={orgName}
          description={`${legalName} · Licensed Dispensing Organization Record`}
        />

        <OrganizationProfileView
          org={organization}
          isOrgAdmin={isOrgAdmin}
          userRoleLabel={role ? roleLabels[role] || role : 'Pharmacy Staff'}
          memberCount={memberCount}
          portalKind="pharmacy"
          onSaveOrg={updateOrganization}
        />
      </div>
    </>
  );
}
