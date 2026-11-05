import { useCallback, useEffect, useMemo, useState } from 'react';
import {useAutoRefresh} from './useAutoRefresh';
import {useToast} from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import type { Analyte, LabOrder, LabReport, LabStaffRole, LabTestStatus } from '../types/lab';
import type {
  OrganizationContextResponse,
  OrganizationMembership,
  OrganizationProfile,
} from '../types/organization';
import { safeApiFetch } from '../utils/apiFetch';

type ApiOrder = {
  id: string;
  accession_number: string;
  patient_user_id: string;
  doctor_name: string;
  hospital_name: string;
  test_kind: LabOrder['kind'];
  test_name: string;
  status: LabTestStatus;
  priority: LabOrder['priority'];
  requested_at: string;
  collected_at?: string | null;
  resulted_at?: string | null;
};
type ApiReport = {
  id: string;
  lab_order_id: string;
  patient_user_id: string;
  version: number;
  status: LabReport['status'];
  impression: string;
  analytes: Analyte[];
  critical: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  released_at?: string | null;
  created_at?: string;
  lab_orders?: {
    accession_number?: string;
    test_kind?: LabReport['kind'];
    test_name?: string;
    doctor_name?: string;
    hospital_name?: string;
  } | null;
};

const roleAccess: Record<LabStaffRole, string[]> = {
  director: ['all'],
  pathologist: ['verify', 'reports', 'critical', 'publish'],
  technologist: ['tests', 'compose', 'reports'],
  receptionist: ['tests'],
};

function toUiRole(role?: string): LabStaffRole | null {
  if (role === 'laboratory_director' || role === 'laboratory_admin') return 'director';
  if (role === 'laboratory_pathologist') return 'pathologist';
  if (role === 'laboratory_technologist') return 'technologist';
  if (role === 'laboratory_receptionist') return 'receptionist';
  return null;
}

function mapOrder(row: ApiOrder): LabOrder {
  return {
    id: row.id,
    accession: row.accession_number,
    patientName: 'Authorized patient',
    patientId: row.patient_user_id,
    mrn: '—',
    doctor: row.doctor_name,
    hospital: row.hospital_name,
    kind: row.test_kind,
    test: row.test_name,
    status: row.status,
    priority: row.priority,
    requested: row.requested_at,
    collected: row.collected_at || undefined,
    resulted: row.resulted_at || undefined,
  };
}

function mapReport(row: ApiReport): LabReport {
  const order = row.lab_orders || {};
  const history = [
    { at: row.created_at || new Date().toISOString(), actor: 'Laboratory', action: `Created v${row.version}` },
    ...(row.verified_at ? [{ at: row.verified_at, actor: row.verified_by || 'Authorized verifier', action: `Verified v${row.version}` }] : []),
    ...(row.released_at ? [{ at: row.released_at, actor: 'Authorized releaser', action: `Published v${row.version}` }] : []),
  ];
  return {
    id: row.id,
    reportId: `RPT-${order.accession_number || row.id.slice(0, 8)}-V${row.version}`,
    orderId: row.lab_order_id,
    version: row.version,
    title: order.test_name || 'Laboratory report',
    kind: order.test_kind || 'custom',
    patientName: 'Authorized patient',
    patientId: row.patient_user_id,
    doctor: order.doctor_name || '—',
    hospital: order.hospital_name || '—',
    source: 'laboratory',
    status: row.status,
    verifier: row.verified_by || undefined,
    verifiedAt: row.verified_at || undefined,
    publishedAt: row.released_at || undefined,
    impression: row.impression,
    analytes: Array.isArray(row.analytes) ? row.analytes : [],
    history,
    critical: row.critical,
  };
}

export function useLabPortal() {
  const {push}=useToast();
  const perform=useCallback(async(action:()=>Promise<unknown>)=>{try{await action();return true;}catch(error){push({tone:'error',title:'Laboratory action was not saved',description:error instanceof Error?error.message:'Try again.'});return false;}},[push]);
  const { session } = useAuth();
  const token = session?.access_token;
  const [role, setRole] = useState<LabStaffRole | null>(null);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [memberCount, setMemberCount] = useState<number>(1);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit) => {
    if (!token) throw new Error('Your authenticated session is not ready.');
    const result = await safeApiFetch<T>(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [context, orderRows, reportRows] = await Promise.all([
      request<OrganizationContextResponse>('/api/organizations/me'),
      request<ApiOrder[]>('/api/lab/orders'),
      request<ApiReport[]>('/api/lab/report-versions'),
    ]);
    if (context?.organization) {
      setOrganization(context.organization);
      setMembership(context.membership);
      setMemberCount(context.member_count ?? 1);
    }
    setRole(toUiRole(context?.membership?.role));
    setOrders(orderRows.map(mapOrder));
    setReports(reportRows.map(mapReport));
  }, [request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch(() => {
        setRole(null);
        setOrganization(null);
        setMembership(null);
        setOrders([]);
        setReports([]);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useAutoRefresh(refresh,Boolean(token));
  const setOrderStatus = useCallback(async (id: string, status: LabTestStatus) => {
    await request(`/api/lab/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await refresh();
  }, [refresh, request]);

  const saveReport = useCallback(async (report: LabReport) => {
    const isExisting = reports.some((item) => item.id === report.id);
    if (isExisting) {
      await request(`/api/lab/report-versions/${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ impression: report.impression, analytes: report.analytes, critical: report.critical }),
      });
    } else {
      await request(`/api/lab/orders/${encodeURIComponent(report.orderId)}/report-versions`, {
        method: 'POST',
        body: JSON.stringify({ impression: report.impression, analytes: report.analytes, critical: report.critical }),
      });
    }
    await refresh();
  }, [refresh, reports, request]);

  const verifyReport = useCallback(async (id: string, _verifier?: string) => {
    void _verifier;
    await request(`/api/lab/report-versions/${encodeURIComponent(id)}/verify`, { method: 'POST', body: '{}' });
    await refresh();
  }, [refresh, request]);

  const publishReport = useCallback(async (id: string) => {
    await request(`/api/lab/report-versions/${encodeURIComponent(id)}/release`, { method: 'POST', body: '{}' });
    await refresh();
  }, [refresh, request]);

  const reviseReport = useCallback(async (id: string) => {
    await request(`/api/lab/report-versions/${encodeURIComponent(id)}/revise`, { method: 'POST', body: '{}' });
    await refresh();
  }, [refresh, request]);

  const isOrgAdmin = role === 'director' || membership?.role === 'laboratory_admin';

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
      const msg = err instanceof Error ? err.message : 'Failed to update laboratory organization profile.';
      return { success: false, error: msg };
    }
  }, [request]);

  const can = useCallback((area: string) => Boolean(role && (roleAccess[role].includes('all') || roleAccess[role].includes(area))), [role]);

  return useMemo(() => ({
    role,
    organization,
    membership,
    memberCount,
    isOrgAdmin,
    updateOrganization,
    can,
    orders,
    setOrderStatus: (id: string, status: LabTestStatus) => perform(()=>setOrderStatus(id,status)),
    reports,
    saveReport: (report: LabReport) => perform(()=>saveReport(report)),
    verifyReport: (id: string, verifier?: string) => perform(()=>verifyReport(id,verifier)),
    publishReport: (id: string) => perform(()=>publishReport(id)),
    reviseReport: (id: string) => perform(()=>reviseReport(id)),
    refresh,
  }), [perform,can, isOrgAdmin, memberCount, membership, orders, organization, publishReport, refresh, reports, reviseReport, role, saveReport, setOrderStatus, updateOrganization, verifyReport]);
}
