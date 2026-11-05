import { useState } from 'react';
import {
  ShieldCheck as ShieldCheckIcon,
  UserCheck as UserCheckIcon,
  Building2 as BuildingOffice2Icon,
  CheckCircle2 as CheckCircle2Icon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  FileCheck as DocumentCheckIcon,
  Plus as PlusIcon,
  GraduationCap as AcademicCapIcon,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAdminPortal } from '../../hooks/useAdminPortal';
import { useToast } from '../../providers/ToastProvider';
import type { PlatformOrg, PlatformRole } from '../../types/admin';

function getCompatibleOrgKind(role: PlatformRole): string {
  if (role === 'doctor') return 'hospital';
  return role;
}

export default function AdminVerificationPage() {
  const { orgs, verifiedOrgs, pendingApplications, setOrgStatus, createOrg, approveApplicant } = useAdminPortal();
  const { push } = useToast();

  const [selectedOrgs, setSelectedOrgs] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Organization registration modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orgKind, setOrgKind] = useState<PlatformOrg['kind']>('laboratory');
  const [orgDisplayName, setOrgDisplayName] = useState('');
  const [orgLegalName, setOrgLegalName] = useState('');
  const [orgRegistration, setOrgRegistration] = useState('');
  const [submittingOrg, setSubmittingOrg] = useState(false);

  const orgQueue = orgs.filter((o) => o.status === 'pending' || o.status === 'under-review');

  const openRegisterModal = (initial?: {
    kind?: PlatformOrg['kind'];
    displayName?: string;
    legalName?: string;
  }) => {
    setOrgKind(initial?.kind || 'laboratory');
    setOrgDisplayName(initial?.displayName || '');
    setOrgLegalName(initial?.legalName || initial?.displayName || '');
    setOrgRegistration('');
    setIsModalOpen(true);
  };

  const handleSubmitOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgDisplayName.trim() || !orgLegalName.trim()) {
      push({ tone: 'error', title: 'Missing details', description: 'Display name and Legal name are required.' });
      return;
    }
    setSubmittingOrg(true);
    try {
      const res = await createOrg({
        kind: orgKind,
        displayName: orgDisplayName.trim(),
        legalName: orgLegalName.trim(),
        registrationNumber: orgRegistration.trim() || undefined,
      });
      if (res.success) {
        push({
          tone: 'success',
          title: 'Organization submitted',
          description: `${orgDisplayName.trim()} submitted with status pending. Review packet below.`,
        });
        setIsModalOpen(false);
        setOrgDisplayName('');
        setOrgLegalName('');
        setOrgRegistration('');
      } else {
        push({
          tone: 'error',
          title: 'Submission failed',
          description: res.error || 'Server rejected organization packet.',
        });
      }
    } finally {
      setSubmittingOrg(false);
    }
  };

  const handleApproveApplicant = async (applicantId: string, role: PlatformRole) => {
    const compatibleKind = getCompatibleOrgKind(role);
    const compatibleOrgs = verifiedOrgs.filter((o) => o.kind === compatibleKind);
    const chosenOrgId = selectedOrgs[applicantId] || compatibleOrgs[0]?.id;

    if (!chosenOrgId) {
      push({
        tone: 'error',
        title: 'Organization required',
        description: `Please select a verified ${compatibleKind} organization for this ${role}.`,
      });
      return;
    }

    setApprovingId(applicantId);
    try {
      const res = await approveApplicant(applicantId, chosenOrgId);
      if (res.success) {
        push({
          tone: 'success',
          title: 'Professional approved',
          description: 'Applicant profile role verified and active membership provisioned.',
        });
      } else {
        push({
          tone: 'error',
          title: 'Approval rejected',
          description: res.error || 'Server rejected approval request.',
        });
      }
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <Seo title="Verification Center | Platform Governance" description="Credential review and authority provisioning." />
      <PatientPageHeader
        title="Verification Center"
        description="Verify healthcare practitioners and certify clinical organizations before clinical authority is provisioned."
        action={
          <Button
            size="sm"
            onClick={() => openRegisterModal({ kind: 'laboratory' })}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Register organization</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* METRICS STAT ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Pending Doctors</span>
              <UserCheckIcon className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-ink-900">{pendingApplications.length}</div>
            <span className="text-xs text-ink-500">Awaiting provisioning</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-brand-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Org Reviews</span>
              <BuildingOffice2Icon className="h-4 w-4 text-brand-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-ink-900">{orgQueue.length}</div>
            <span className="text-xs text-ink-500">Facilities in queue</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Verified Network</span>
              <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-ink-900">{verifiedOrgs.length}</div>
            <span className="text-xs text-ink-500">Authorized issuers</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-sky-600">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Governance Status</span>
              <DocumentCheckIcon className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">100%</div>
            <span className="text-xs text-ink-500">Professional account review</span>
          </Card>
        </div>

        {/* SECTION 1: PROFESSIONAL APPLICATIONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-brand-600" />
                Professional Practitioner Applications
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Physicians, specialists, and clinicians requiring medical registry verification and facility affiliation.
              </p>
            </div>
            <Badge tone={pendingApplications.length ? 'amber' : 'slate'}>
              {pendingApplications.length} pending
            </Badge>
          </div>

          {pendingApplications.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={CheckCircle2Icon}
                title="All Practitioner Applications Cleared"
                description="There are currently no healthcare practitioners awaiting credential verification or organization association."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingApplications.map((app) => {
                const compatibleKind = getCompatibleOrgKind(app.requestedRole);
                const eligibleOrgs = verifiedOrgs.filter((o) => o.kind === compatibleKind);
                const selectedOrgId = selectedOrgs[app.id] || eligibleOrgs[0]?.id || '';

                const orgOptions = eligibleOrgs.map((o) => ({
                  value: o.id,
                  label: `${o.name} (${o.registration})`,
                }));

                const initials = app.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <Card key={app.id} className="p-5 hover:shadow-md transition-shadow border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-ink-900">{app.fullName}</h3>
                            <Badge tone="sky" className="capitalize">{app.requestedRole}</Badge>
                            <Badge tone="amber">Pending Verification</Badge>
                          </div>
                          <p className="mt-1 text-xs text-ink-600">
                            {app.email} · Affiliation: <span className="font-medium text-ink-800">{app.requestedOrg || 'Independent'}</span>
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-400">
                            <ClockIcon className="h-3 w-3" />
                            <span>Submitted on {app.createdAt.slice(0, 10)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-80 space-y-2">
                        {orgOptions.length > 0 ? (
                          <div>
                            <Select
                              label={`Target Verified ${compatibleKind.toUpperCase()}`}
                              value={selectedOrgId}
                              onChange={(e) =>
                                setSelectedOrgs((prev) => ({ ...prev, [app.id]: e.target.value }))
                              }
                              options={orgOptions}
                            />
                            <div className="mt-2 flex justify-end">
                              <Button
                                size="sm"
                                disabled={approvingId === app.id || !selectedOrgId}
                                onClick={() => handleApproveApplicant(app.id, app.requestedRole)}
                                className="w-full sm:w-auto"
                              >
                                {approvingId === app.id ? 'Provisioning...' : 'Approve & Provision License'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                            <p className="text-xs font-medium text-amber-900">
                              No verified {compatibleKind} organizations available. Verify an organization first.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openRegisterModal({
                                  kind: compatibleKind as PlatformOrg['kind'],
                                  displayName: app.requestedOrg || '',
                                  legalName: app.requestedOrg || '',
                                })
                              }
                              className="text-xs w-full"
                            >
                              + Register {app.requestedOrg ? `"${app.requestedOrg}"` : `a ${compatibleKind}`}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: ISSUER ORGANIZATIONS */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                <BuildingOffice2Icon className="h-5 w-5 text-brand-600" />
                Issuer organizations · Facility Verification Queue
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Accreditation review for hospitals, clinical laboratories, pharmacies, and health insurance payers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={orgQueue.length ? 'amber' : 'slate'}>{orgQueue.length} awaiting inspection</Badge>
            </div>
          </div>

          {orgQueue.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={BuildingOffice2Icon}
                title="No Facilities Awaiting Inspection"
                description="All submitted hospital, lab, and pharmacy organization packets have been adjudicated."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRegisterModal({ kind: 'laboratory' })}
                    className="mt-3"
                  >
                    Register New Facility Packet
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {orgQueue.map((o) => (
                <Card key={o.id} className="p-5 border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink-900 text-base">{o.name}</h3>
                        <Badge tone="sky" className="capitalize">{o.kind}</Badge>
                        <Badge tone="amber">{o.status.replace('-', ' ')}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span>Registry: <strong className="text-ink-700">{o.registration}</strong></span>
                        <span>Docket Date: {o.created}</span>
                        {o.documents.length > 0 && (
                          <span className="text-brand-700">Dockets: {o.documents.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Verify ${o.name} as an authorized platform issuer?`)) {
                            const res = await setOrgStatus(o.id, 'verified');
                            if (res?.success === false) {
                              push({ tone: 'error', title: 'Verification failed', description: res.error || 'Server rejected verification.' });
                            } else {
                              push({ tone: 'success', title: 'Organization verified', description: `${o.name} is now a certified ${o.kind} issuer.` });
                            }
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2Icon className="h-4 w-4 mr-1" />
                        Verify Organization
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          if (window.confirm(`Reject organization packet for ${o.name}?`)) {
                            const res = await setOrgStatus(o.id, 'rejected');
                            if (res?.success === false) {
                              push({ tone: 'error', title: 'Rejection failed', description: res.error });
                            } else {
                              push({ tone: 'info', title: 'Rejected', description: `${o.name} status updated to rejected.` });
                            }
                          }
                        }}
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL: Register Organization for Verification */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Healthcare Facility for Verification"
        description="Submit a new clinical facility or issuer organization for administrative compliance verification."
      >
        <form onSubmit={handleSubmitOrg} className="space-y-4">
          <Input
            label="Organization display name"
            placeholder="e.g. Yash Diagnostic Clinic"
            value={orgDisplayName}
            onChange={(e) => setOrgDisplayName(e.target.value)}
            required
          />
          <Input
            label="Legal entity name"
            placeholder="e.g. Yash Diagnostic Clinic LLC"
            value={orgLegalName}
            onChange={(e) => setOrgLegalName(e.target.value)}
            required
          />
          <Select
            label="Organization kind"
            value={orgKind}
            onChange={(e) => setOrgKind(e.target.value as PlatformOrg['kind'])}
            options={[
              { value: 'laboratory', label: 'Laboratory' },
              { value: 'hospital', label: 'Hospital' },
              { value: 'pharmacy', label: 'Pharmacy' },
              { value: 'insurance', label: 'Insurance' },
            ]}
          />
          <Input
            label="Registration / CLIA / License number (optional)"
            placeholder="e.g. CLIA-992014 or State License"
            value={orgRegistration}
            onChange={(e) => setOrgRegistration(e.target.value)}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingOrg}>
              Submit for verification
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
