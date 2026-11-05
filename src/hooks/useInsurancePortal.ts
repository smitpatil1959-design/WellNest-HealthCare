import { useCallback, useEffect, useMemo, useState } from 'react';
import {useAutoRefresh} from './useAutoRefresh';
import {useToast} from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import type { ClaimStatus, InsuranceClaim, InsurancePolicy, InsurerStaffRole, PolicyStatus } from '../types/insurance';
import type {
  OrganizationContextResponse,
  OrganizationMembership,
  OrganizationProfile,
} from '../types/organization';
import { safeApiFetch } from '../utils/apiFetch';

type ApiPolicy = { id: string; patient_id: string; plan_name: string; policy_number: string; coverage_type: string; coverage_limit: number; deductible: number; valid_from?: string | null; valid_to?: string | null; status: PolicyStatus; created_at: string };
type ApiClaim = { id: string; patient_user_id: string; insurance_plan_id?: string | null; service_type: string; amount: number; status: ClaimStatus; created_at: string; decision_reason?: string | null };

const access: Record<InsurerStaffRole, string[]> = {
  admin: ['all'], reviewer: ['claims', 'review', 'documents', 'fraud'], 'policy-manager': ['policies', 'members'], support: ['members', 'documents'], auditor: ['claims', 'fraud', 'analytics'],
};

function toRole(role?: string): InsurerStaffRole | null {
  if (role === 'insurance_admin') return 'admin';
  if (role === 'insurance_reviewer') return 'reviewer';
  if (role === 'insurance_policy_manager') return 'policy-manager';
  if (role === 'insurance_support') return 'support';
  if (role === 'insurance_auditor') return 'auditor';
  return null;
}

function mapPolicy(row: ApiPolicy): InsurancePolicy {
  return { id: row.id, policyId: row.policy_number, memberName: 'Authorized member', memberId: row.patient_id, patientId: row.patient_id, avatar: '', status: row.status, plan: row.plan_name, effective: row.valid_from || '', expires: row.valid_to || '', deductible: String(row.deductible), deductibleMet: '—', copay: '—', dependents: [], coverage: [{ service: row.coverage_type || 'Coverage', covered: String(row.coverage_limit), remaining: '—' }] };
}

function mapClaim(row: ApiClaim): InsuranceClaim {
  return { id: row.id, claimId: `CLM-${row.id.slice(0, 8).toUpperCase()}`, policyId: row.insurance_plan_id || '', memberName: 'Authorized member', hospital: '', doctor: '', service: row.service_type, amount: row.amount, status: row.status, submitted: row.created_at, documents: [], notes: row.decision_reason ? [row.decision_reason] : [], flags: [] };
}

export function useInsurancePortal() {
  const {push}=useToast();
  const perform=useCallback(async(action:()=>Promise<unknown>)=>{try{await action();return true;}catch(error){push({tone:'error',title:'Insurance action was not saved',description:error instanceof Error?error.message:'Try again.'});return false;}},[push]);
  const { session } = useAuth();
  const token = session?.access_token;
  const [role, setRole] = useState<InsurerStaffRole | null>(null);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [memberCount, setMemberCount] = useState<number>(1);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit) => {
    if (!token) throw new Error('Your authenticated session is not ready.');
    const result = await safeApiFetch<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) } });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [context, policyRows, claimRows] = await Promise.all([
      request<OrganizationContextResponse>('/api/organizations/me'),
      request<ApiPolicy[]>('/api/insurance/policies'),
      request<ApiClaim[]>('/api/insurance/claims'),
    ]);
    if (context?.organization) {
      setOrganization(context.organization);
      setMembership(context.membership);
      setMemberCount(context.member_count ?? 1);
    }
    setRole(toRole(context?.membership?.role));
    setPolicies(policyRows.map(mapPolicy));
    setClaims(claimRows.map(mapClaim));
  }, [request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch(() => {
        setRole(null);
        setOrganization(null);
        setMembership(null);
        setPolicies([]);
        setClaims([]);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useAutoRefresh(refresh,Boolean(token));
  const isOrgAdmin = role === 'admin' || membership?.role === 'insurance_admin';

  const updateOrganization = useCallback(async (updates: Partial<OrganizationProfile>) => {
    try {
      const result = await request<{ success: boolean; organization: OrganizationProfile }>('/api/organizations/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (result?.organization) {
        setOrganization(result.organization);
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update insurance organization profile.';
      return { success: false, error: msg };
    }
  }, [request]);

  const can = useCallback((area: string) => Boolean(role && (access[role].includes('all') || access[role].includes(area))), [role]);
  const upsertPolicy = useCallback(async (policy: InsurancePolicy, healthId = '') => {
    await request('/api/insurance/policies', { method: 'POST', body: JSON.stringify({ healthId, planName: policy.plan, policyNumber: policy.policyId, coverageType: policy.coverage[0]?.service || '', coverageLimit: Number(policy.coverage[0]?.covered) || 0, deductible: Number(policy.deductible) || 0, validFrom: policy.effective, validTo: policy.expires }) });
    await refresh();
  }, [refresh, request]);
  const setPolicyStatus = useCallback(async (id: string, status: PolicyStatus) => { await request(`/api/insurance/policies?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refresh(); }, [refresh, request]);
  const setClaimStatus = useCallback(async (id: string, status: ClaimStatus, note?: string) => { await request(`/api/insurance/claims/${encodeURIComponent(id)}/review`, { method: 'PATCH', body: JSON.stringify({ status, decisionReason: note }) }); await refresh(); }, [refresh, request]);
  const addNote = useCallback(async (id: string, note: string) => { await setClaimStatus(id, 'review', note); }, [setClaimStatus]);

  return useMemo(() => ({
    role,
    setRole: (next: InsurerStaffRole) => { void next; },
    organization,
    membership,
    memberCount,
    isOrgAdmin,
    updateOrganization,
    can,
    policies,
    upsertPolicy:(policy:InsurancePolicy,healthId='')=>perform(()=>upsertPolicy(policy,healthId)),
    setPolicyStatus: (id: string, status: PolicyStatus) => perform(()=>setPolicyStatus(id,status)),
    claims,
    setClaimStatus: (id: string, status: ClaimStatus, note?: string) => perform(()=>setClaimStatus(id,status,note)),
    addNote: (id: string, note: string) => perform(()=>addNote(id,note)),
    refresh,
  }), [perform,addNote, can, claims, isOrgAdmin, memberCount, membership, organization, policies, refresh, role, setClaimStatus, setPolicyStatus, updateOrganization, upsertPolicy]);
}
