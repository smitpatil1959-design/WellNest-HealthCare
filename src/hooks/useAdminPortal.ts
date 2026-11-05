import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AccountStatus, OrgStatus, PlatformOrg, PlatformUser, PendingApplication, AuditEntry } from '../types/admin';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import {useAutoRefresh} from './useAutoRefresh';
import { useToast } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import { safeApiFetch } from '../utils/apiFetch';

interface ApiOrg {
  id: string;
  kind: PlatformOrg['kind'];
  legal_name: string;
  display_name: string;
  registration_number: string | null;
  status: OrgStatus;
  verified_at: string | null;
  created_at: string;
}

export function useAdminPortal() {
  const { session } = useAuth();
  const token = session?.access_token;

  const userQuery = useAuthenticatedApi<PlatformUser[]>('/api/admin/users');
  const auditQuery = useAuthenticatedApi<AuditEntry[]>('/api/admin/audit');
  const { push } = useToast();
  const users = userQuery.data || [];
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);

  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch real organizations
      const orgRes = await safeApiFetch<ApiOrg[]>('/api/admin/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok && Array.isArray(orgRes.data)) {
        const mapped: PlatformOrg[] = orgRes.data.map((o) => ({
          id: o.id,
          name: o.display_name || o.legal_name,
          kind: o.kind,
          status: o.status,
          registration: o.registration_number || 'N/A',
          users: 0,
          created: o.created_at ? o.created_at.slice(0, 10) : '2026-01-01',
          documents: [],
        }));
        setOrgs(mapped);
      }

      // 2. Fetch real pending applications
      const appRes = await safeApiFetch<PendingApplication[]>('/api/admin/pending-applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok && Array.isArray(appRes.data)) {
        setPendingApplications(appRes.data);
      }
    } catch (err) {
      console.warn('[useAdminPortal load error]', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token, loadData]);

  useAutoRefresh(loadData,Boolean(token));
  const setUserStatus = useCallback(async (id: string, status: AccountStatus) => {
    const result = await safeApiFetch('/api/admin/users', { method: 'PATCH', headers: { Authorization: `Bearer ${token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (!result.ok) { push({ tone: 'error', title: 'Account was not changed', description: result.error }); return; }
    await userQuery.refetch();
    await auditQuery.refetch();
    push({ tone: 'success', title: 'Account status saved' });
  }, [token, push, userQuery.refetch, auditQuery.refetch]);

  const setOrgStatus = useCallback(async (id: string, status: OrgStatus, reviewer = 'Platform Operator'): Promise<{ success: boolean; error?: string }> => {
    void reviewer;
    if (token) {
      let res = await safeApiFetch(`/api/admin/organizations/${id}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, id }),
      });
      if (!res.ok) {
        res = await safeApiFetch('/api/admin/organizations', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id, status }),
        });
      }
      if (res.ok) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to update organization status on server.' };
    }
    return { success: false, error: 'Sign in as an administrator to change organizations.' };
  }, [token, loadData]);

  const createOrg = useCallback(async (data: {
    kind: PlatformOrg['kind'];
    legalName: string;
    displayName: string;
    registrationNumber?: string;
  }): Promise<{ success: boolean; error?: string; data?: ApiOrg }> => {
    if (!token) {
      return { success: false, error: 'Administrator authentication token required.' };
    }
    const res = await safeApiFetch<ApiOrg>('/api/admin/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: res.error || 'Failed to submit organization.' };
    }

    await loadData();
    return { success: true, data: res.data };
  }, [token, loadData]);

  const approveApplicant = useCallback(async (applicantUserId: string, targetOrganizationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
      return { success: false, error: 'Administrator authentication token required.' };
    }
    const res = await safeApiFetch<{ success: boolean; error?: string }>('/api/admin/approve-applicant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ applicantUserId, targetOrganizationId }),
    });

    if (!res.ok) {
      return { success: false, error: res.error || 'Approval failed.' };
    }

    await loadData();
    return { success: true };
  }, [token, loadData]);

  const verifiedOrgs = useMemo(
    () => orgs.filter((o) => o.status === 'verified'),
    [orgs],
  );

  return useMemo(
    () => ({
      users,
      orgs,
      verifiedOrgs,
      pendingApplications,
      loading,
      setUserStatus,
      setOrgStatus,
      createOrg,
      approveApplicant,
      reload: loadData,
      audit: auditQuery.data || [],
    }),
    [users, orgs, verifiedOrgs, pendingApplications, loading, setUserStatus, setOrgStatus, createOrg, approveApplicant, loadData, auditQuery.data],
  );
}
