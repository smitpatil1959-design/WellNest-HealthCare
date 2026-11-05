import { useCallback, useEffect, useMemo, useState } from 'react';
import {useAutoRefresh} from './useAutoRefresh';
import { useAuth } from '../providers/AuthProvider';
import type {
  OrganizationContextResponse,
  OrganizationMembership,
  OrganizationProfile,
} from '../types/organization';
import type { InventoryItem, PharmacyRx, PharmacyStaffRole, RxStatus } from '../types/pharmacy';
import { safeApiFetch } from '../utils/apiFetch';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import { useToast } from '../providers/ToastProvider';
type ApiPrescription = {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  medicine: string;
  dosage: string;
  duration: string;
  instructions?: string | null;
  refills_left: number;
  issued: string;
  pharmacy_event?: {
    verification_status: string;
    dispensing_status: RxStatus;
    verified_by?: string | null;
    verified_at?: string | null;
    rejection_reason?: string | null;
  } | null;
};

const access: Record<PharmacyStaffRole, string[]> = {
  'pharmacist-in-charge': ['all'],
  pharmacist: ['verify', 'queue', 'orders', 'connect', 'inventory'],
  technician: ['queue', 'orders'],
  cashier: ['orders', 'connect'],
};

function toRole(role?: string): PharmacyStaffRole | null {
  if (role === 'pharmacy_admin') return 'pharmacist-in-charge';
  if (role === 'pharmacist') return 'pharmacist';
  if (role === 'pharmacy_technician') return 'technician';
  if (role === 'pharmacy_cashier') return 'cashier';
  return null;
}

function mapPrescription(row: ApiPrescription): PharmacyRx {
  return {
    id: row.id,
    rxNumber: `RX-${row.id.slice(0, 8).toUpperCase()}`,
    patientName: 'Authorized patient',
    patientId: row.patient_id,
    dob: '',
    allergies: [],
    doctor: row.doctor_id ? 'Authorized prescriber' : 'Prescriber unavailable',
    hospital: '',
    source: 'doctor',
    status: row.pharmacy_event?.dispensing_status || 'pending',
    medicine: row.medicine,
    dosage: row.dosage,
    quantity: '',
    refills: row.refills_left,
    sig: row.instructions || '',
    written: row.issued,
    received: row.issued,
    notes: row.pharmacy_event?.rejection_reason || '',
    interactions: [],
    verifier: row.pharmacy_event?.verified_by || undefined,
    verifiedAt: row.pharmacy_event?.verified_at || undefined,
  };
}

export function usePharmacyPortal() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [role, setRole] = useState<PharmacyStaffRole | null>(null);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [memberCount, setMemberCount] = useState<number>(1);
  const [scripts, setScripts] = useState<PharmacyRx[]>([]);
  const inventoryQuery = useAuthenticatedApi<InventoryItem[]>('/api/pharmacy/inventory', Boolean(role && role !== 'cashier'));
  const stock = inventoryQuery.data || [];
  const { push } = useToast();

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
    const [context, rows] = await Promise.all([
      request<OrganizationContextResponse>('/api/organizations/me'),
      request<ApiPrescription[]>('/api/pharmacy/prescriptions'),
    ]);
    if (context?.organization) {
      setOrganization(context.organization);
      setMembership(context.membership);
      setMemberCount(context.member_count ?? 1);
    }
    setRole(toRole(context?.membership?.role));
    setScripts(rows.map(mapPrescription));
  }, [request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch(() => {
        setRole(null);
        setOrganization(null);
        setMembership(null);
        setScripts([]);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useAutoRefresh(refresh,Boolean(token));
  const isOrgAdmin = role === 'pharmacist-in-charge' || membership?.role === 'pharmacy_admin';

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
      const msg = err instanceof Error ? err.message : 'Failed to update pharmacy organization profile.';
      return { success: false, error: msg };
    }
  }, [request]);

  const can = useCallback((area: string) => Boolean(role && (access[role].includes('all') || access[role].includes(area))), [role]);
  const setStatus = useCallback(async (id: string, status: RxStatus) => {
    await request(`/api/pharmacy/prescriptions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ prescriptionId: id, status }) });
    await refresh();
  }, [refresh, request]);
  const verify = useCallback(async (id: string, verifier?: string) => {
    void verifier;
    await request(`/api/pharmacy/prescriptions/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ prescriptionId: id }) });
    await refresh();
  }, [refresh, request]);
  const reject = useCallback(async (id: string, reason: string) => {
    await request(`/api/pharmacy/prescriptions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ prescriptionId: id, status: 'cancelled', rejectionReason: reason }) });
    await refresh();
  }, [refresh, request]);
  const adjustStock = useCallback(async (id: string, onHand: number) => {
    const item = stock.find(row => row.id === id);
    try {
      await request('/api/pharmacy/inventory', { method: 'PATCH', body: JSON.stringify({ id, onHand, version: item?.version }) });
      await inventoryQuery.refetch();
      push({ tone: 'success', title: 'Stock count saved' });
    } catch (error) { push({ tone: 'error', title: 'Stock was not changed', description: error instanceof Error ? error.message : 'Try again.' }); }
  }, [stock, request, inventoryQuery.refetch, push]);
  const addStock = useCallback(async (input: Omit<InventoryItem, 'id' | 'version'>) => {
    try {
      await request('/api/pharmacy/inventory', { method: 'POST', body: JSON.stringify(input) });
      await inventoryQuery.refetch();
      push({ tone: 'success', title: 'Inventory batch saved' });
      return true;
    } catch (error) { push({ tone: 'error', title: 'Batch was not saved', description: error instanceof Error ? error.message : 'Try again.' }); return false; }
  }, [request, inventoryQuery.refetch, push]);
  const runPrescriptionAction = async (action: () => Promise<void>) => {
    try { await action(); return true; } catch (error) { push({ tone: 'error', title: 'Prescription was not changed', description: error instanceof Error ? error.message : 'Try again.' }); return false; }
  };

  return useMemo(() => ({
    role,
    setRole: (next: PharmacyStaffRole) => { void next; },
    organization,
    membership,
    memberCount,
    isOrgAdmin,
    updateOrganization,
    can,
    scripts,
    setStatus: (id: string, status: RxStatus) => runPrescriptionAction(() => setStatus(id, status)),
    verify: (id: string, verifier?: string) => runPrescriptionAction(() => verify(id, verifier)),
    reject: (id: string, reason: string) => runPrescriptionAction(() => reject(id, reason)),
    stock,
    adjustStock,
    addStock,
    inventoryError: inventoryQuery.error,
    inventoryLoading: inventoryQuery.isLoading,
    refresh,
  }), [adjustStock, addStock, inventoryQuery.error, inventoryQuery.isLoading, can, isOrgAdmin, memberCount, membership, organization, refresh, reject, role, scripts, setStatus, stock, updateOrganization, verify]);
}
