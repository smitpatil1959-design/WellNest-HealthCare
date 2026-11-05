import { useState, type FormEvent } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  FileBadge,
  Edit3,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import { computeOrgCompleteness, type OrganizationProfile } from '../../types/organization';

interface OrganizationProfileViewProps {
  org: OrganizationProfile | null | undefined;
  isOrgAdmin: boolean;
  userRoleLabel?: string;
  memberCount?: number;
  portalKind: 'laboratory' | 'hospital' | 'pharmacy' | 'insurance';
  onSaveOrg?: (updates: Partial<OrganizationProfile>) => Promise<{ success: boolean; error?: string }>;
}

export function OrganizationProfileView({
  org,
  isOrgAdmin,
  userRoleLabel,
  memberCount,
  portalKind,
  onSaveOrg,
}: OrganizationProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [phone, setPhone] = useState(org?.phone || '');
  const [email, setEmail] = useState(org?.email || '');
  const [website, setWebsite] = useState(org?.website || '');
  const [addressLine1, setAddressLine1] = useState(org?.address_line_1 || '');
  const [addressLine2, setAddressLine2] = useState(org?.address_line_2 || '');
  const [city, setCity] = useState(org?.city || '');
  const [state, setState] = useState(org?.state || '');
  const [postalCode, setPostalCode] = useState(org?.postal_code || '');
  const [country, setCountry] = useState(org?.country || 'US');
  const [operatingHours, setOperatingHours] = useState(org?.operating_hours || '');
  const [description, setDescription] = useState(org?.description || '');
  const [servicesInput, setServicesInput] = useState(
    Array.isArray(org?.services) ? org.services.join(', ') : '',
  );

  const completeness = computeOrgCompleteness(org);
  const isVerified = org?.status === 'verified';

  const handleStartEdit = () => {
    setPhone(org?.phone || '');
    setEmail(org?.email || '');
    setWebsite(org?.website || '');
    setAddressLine1(org?.address_line_1 || '');
    setAddressLine2(org?.address_line_2 || '');
    setCity(org?.city || '');
    setState(org?.state || '');
    setPostalCode(org?.postal_code || '');
    setCountry(org?.country || 'US');
    setOperatingHours(org?.operating_hours || '');
    setDescription(org?.description || '');
    setServicesInput(Array.isArray(org?.services) ? org.services.join(', ') : '');
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onSaveOrg) return;
    setIsSaving(true);
    setStatusMessage(null);

    const parsedServices = servicesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Partial<OrganizationProfile> = {
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      address_line_1: addressLine1.trim() || null,
      address_line_2: addressLine2.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      postal_code: postalCode.trim() || null,
      country: country.trim() || 'US',
      operating_hours: operatingHours.trim() || null,
      description: description.trim() || null,
      services: parsedServices,
    };

    const result = await onSaveOrg(updates);
    setIsSaving(false);
    if (result.success) {
      setStatusMessage({ tone: 'success', text: 'Organization profile updated successfully.' });
      setIsEditing(false);
    } else {
      setStatusMessage({ tone: 'error', text: result.error || 'Failed to update organization profile.' });
    }
  };

  if (!org) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-3 text-lg font-semibold text-ink-900">Organization record unavailable</h3>
        <p className="mt-1 text-sm text-ink-500">
          Your account is waiting for active verified organization membership assignment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <Alert
          tone={statusMessage.tone}
          title={statusMessage.tone === 'success' ? 'Profile Updated' : 'Update Failed'}
        >
          {statusMessage.text}
        </Alert>
      ) : null}

      {/* Primary Identity Card */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                {portalKind} Entity
              </span>
              {isVerified ? (
                <Badge tone="emerald" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Organization
                </Badge>
              ) : (
                <Badge tone="amber" className="gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Status: {org.status}
                </Badge>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {org.display_name}
            </h2>
            <p className="text-sm text-ink-500">
              Legal name: <strong className="font-semibold text-ink-800">{org.legal_name}</strong>
            </p>
            {org.description ? (
              <p className="pt-2 text-sm text-ink-600 max-w-2xl">{org.description}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {isOrgAdmin ? (
              <Button
                variant={isEditing ? 'outline' : 'primary'}
                size="sm"
                onClick={() => (isEditing ? setIsEditing(false) : handleStartEdit())}
                className="gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                {isEditing ? 'Cancel Editing' : 'Edit Organization Profile'}
              </Button>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-right">
                <span className="text-[11px] font-semibold text-ink-400 block">Your Organization Role</span>
                <span className="text-xs font-bold text-ink-800">{userRoleLabel || 'Staff Member'}</span>
                <p className="text-[10px] text-ink-400 mt-0.5">Profile edits restricted to Admins</p>
              </div>
            )}
          </div>
        </div>

        {/* Completeness bar */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-ink-700">Organization Profile Completeness</span>
            <span
              className={
                completeness.percent >= 80
                  ? 'text-emerald-700 font-bold'
                  : completeness.percent >= 50
                    ? 'text-amber-700 font-bold'
                    : 'text-rose-600 font-bold'
              }
            >
              {completeness.percent}% Complete
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completeness.percent >= 80
                  ? 'bg-emerald-500'
                  : completeness.percent >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(completeness.percent, 5)}%` }}
            />
          </div>
          {completeness.missing.length > 0 ? (
            <p className="mt-2 text-[11px] text-ink-500">
              Missing items: {completeness.missing.join(', ')}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All standard organization fields are complete.
            </p>
          )}
        </div>
      </Card>

      {/* Edit Form for Admins */}
      {isEditing && isOrgAdmin ? (
        <Card className="p-6 sm:p-8 border-brand-200 bg-brand-50/20">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-ink-900">Edit Organization Information</h3>
              <p className="text-xs text-ink-500">
                Update public contact, operational, and location details for {org.display_name}.
              </p>
            </div>
            <span className="text-xs font-mono text-ink-400">Org ID: {org.id.slice(0, 8)}</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact Phone"
                placeholder="+1 (555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Contact Email"
                type="email"
                placeholder="contact@organization.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Official Website"
                placeholder="https://example.org"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <Input
                label="Operating Hours"
                placeholder="Mon-Fri: 8:00 AM - 6:00 PM"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Street Address Line 1"
                placeholder="100 Medical Center Way"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <Input
                label="Suite / Unit / Building (Optional)"
                placeholder="Suite 400"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
              <Input
                label="City"
                placeholder="Metropolis"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="State / Province"
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  label="Postal Code"
                  placeholder="90210"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Input
                label="Services & Capabilities (comma-separated)"
                placeholder="Blood Testing, PCR Diagnostics, Lipid Panel, Molecular Pathology"
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                hint="Enter services separated by commas"
              />
            </div>

            <div>
              <Textarea
                label="Organization Description"
                rows={3}
                placeholder="Overview of clinical, laboratory, or healthcare mission..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Note about locked legal fields */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-ink-600 flex items-start gap-2">
              <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong>Legal identity & verification locks:</strong> Legal Name, Organization Type,
                Registration Number, and Verification Status are server-locked. Changes require Super Admin verification review.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? 'Saving Changes...' : 'Save Organization Profile'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Credentialing & Verification Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Verification & Legal Identity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileBadge className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-ink-900">Legal & Verification Identity</h3>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <Field label="Organization ID (UUID)" value={org.id} fontMono />
            <Field label="Legal Entity" value={org.legal_name} />
            <Field label="Organization Type" value={org.kind.toUpperCase()} />
            <Field
              label="Registration Number"
              value={org.registration_number || 'Not recorded'}
            />
            {org.license_number ? (
              <Field label="License / CLIA / NPI" value={org.license_number} />
            ) : null}
            {org.accreditation ? (
              <Field label="Accreditation" value={org.accreditation} />
            ) : null}
            <Field
              label="Verification Status"
              value={
                org.status === 'verified'
                  ? `Verified${org.verified_at ? ` on ${new Date(org.verified_at).toLocaleDateString()}` : ''}`
                  : `Status: ${org.status}`
              }
            />
            <Field
              label="Registered On"
              value={org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
            />
          </dl>
        </Card>

        {/* Contact & Location Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-ink-900">Contact & Operations</h3>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <Field
              label="Address"
              value={
                [org.address_line_1, org.address_line_2, org.city, org.state, org.postal_code]
                  .filter(Boolean)
                  .join(', ') || 'Not on file'
              }
            />
            <Field label="Phone" value={org.phone || 'Not on file'} />
            <Field label="Email" value={org.email || 'Not on file'} />
            <Field label="Website" value={org.website || 'Not on file'} />
            <Field label="Operating Hours" value={org.operating_hours || 'Not on file'} />
            {typeof memberCount === 'number' ? (
              <Field label="Active Staff Members" value={`${memberCount} active members`} />
            ) : null}
          </dl>
        </Card>
      </div>

      {/* Services & Capabilities */}
      <Card className="p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="h-4 w-4 text-brand-600" />
          <h3 className="font-semibold text-ink-900">Services & Capabilities</h3>
        </div>
        {Array.isArray(org.services) && org.services.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {org.services.map((svc) => (
              <Badge key={svc} tone="slate" className="text-xs px-3 py-1">
                {svc}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-500 italic">
            No specific clinical services or catalog items entered yet.{' '}
            {isOrgAdmin ? 'Edit profile to list services.' : ''}
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  fontMono,
}: {
  label: string;
  value: string;
  fontMono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-slate-50 last:border-b-0">
      <dt className="text-ink-400 text-xs">{label}</dt>
      <dd
        className={`font-medium text-ink-900 text-xs sm:text-right ${fontMono ? 'font-mono' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}
