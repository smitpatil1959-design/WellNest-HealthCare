import { useCallback, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { useAuthenticatedApi } from './useAuthenticatedApi';
import { safeApiFetch } from '../utils/apiFetch';
import type { OrganizationContextResponse, OrganizationProfile } from '../types/organization';
import type { Admission, Department, DischargeDraft, HospitalAppointment, HospitalConsult, HospitalDoctor, HospitalPatient, HospitalReport, HospitalStaffRole, LabRequest } from '../types/hospital';

type Entry = { id: string; kind: string; payload: Record<string, unknown>; version: number };
const roleMap: Record<string, HospitalStaffRole> = { hospital_admin: 'admin', hospital_doctor: 'doctor', hospital_receptionist: 'receptionist', hospital_nurse: 'nurse', hospital_laboratory: 'laboratory' };
const access: Record<HospitalStaffRole, string[]> = {
  admin: ['all'], doctor: ['patients', 'appointments', 'records', 'reports', 'labs', 'discharge'],
  receptionist: ['patients', 'register', 'appointments'], nurse: ['patients', 'admissions', 'appointments'], laboratory: ['labs', 'reports'],
};

export function useHospitalPortal() {
  const { session } = useAuth();
  const { push } = useToast();
  const context = useAuthenticatedApi<OrganizationContextResponse>('/api/organizations/me');
  const entries = useAuthenticatedApi<Entry[]>('/api/hospital/entries');
  const saving = useRef(false);
  const organization = context.data?.organization || null;
  const membership = context.data?.membership || null;
  const staffRole = membership ? roleMap[membership.role] : undefined;
  const can = (area: string) => Boolean(staffRole && membership?.status === 'active' && (access[staffRole].includes('all') || access[staffRole].includes(area)));
  const rows = <T,>(kind: string): T[] => (entries.data || []).filter(row => row.kind === kind).map(row => ({ ...row.payload, id: row.id }) as T);

  const save = useCallback(async <T extends { id?: string },>(kind: string, input: T): Promise<(T & { id: string }) | null> => {
    if (saving.current) return null;
    saving.current = true;
    try {
    const previous = entries.data?.find(row => row.id === input.id && row.kind === kind);
    const result = await safeApiFetch<Entry>('/api/hospital/entries', {
      method: previous ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id: previous?.id, version: previous?.version, payload: input }),
    });
    if (!result.ok) {
      push({ tone: 'error', title: 'Change was not saved', description: result.error });
      return null;
    }
    await entries.refetch();
    return { ...result.data.payload, id: result.data.id } as T & { id: string };
    } finally { saving.current = false; }
  }, [entries.data, entries.refetch, push, session?.access_token]);
  const patients = rows<HospitalPatient>('patients');
  const registerPatient = async (input: Omit<HospitalPatient, 'id' | 'mrn' | 'lastVisit' | 'avatar'> & { healthId?: string }) => {
    const duplicate = patients.find(patient => patient.name.toLowerCase() === input.name.trim().toLowerCase() && patient.dob === input.dob);
    if (duplicate) return { duplicate, created: null };
    const created = await save('patients', { ...input, id: undefined });
    return { duplicate: null, created: created as HospitalPatient | null };
  };
  const updateOrganization = async (updates: Partial<OrganizationProfile>) => {
    const result = await safeApiFetch('/api/organizations/me', { method: 'PATCH', headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!result.ok) return { success: false, error: result.error };
    await context.refetch();
    return { success: true };
  };
  const labs = rows<LabRequest>('labs');
  const appointments = rows<HospitalAppointment>('appointments');
  return {
    staffRole: staffRole || 'unassigned', can, patients, registerPatient,
    doctors: rows<HospitalDoctor>('doctors'), upsertDoctor: (input: HospitalDoctor) => save('doctors', input),
    depts: rows<Department>('departments'), upsertDept: (input: Department) => save('departments', input),
    admits: rows<Admission>('admissions'), updateAdmission: (input: Admission) => save('admissions', input),
    reports: rows<HospitalReport>('reports'), addReport: (input: Omit<HospitalReport, 'id' | 'updated'>) => save('reports', { ...input, id: undefined }),
    labs, addLab: (input: Omit<LabRequest, 'id'>) => save('labs', { ...input, id: undefined }),
    advanceLab: (id: string) => {
      const row = labs.find(item => item.id === id);
      const states: LabRequest['status'][] = ['requested', 'received', 'completed', 'reviewed', 'notified'];
      return row ? save('labs', { ...row, status: states[Math.min(states.indexOf(row.status) + 1, states.length - 1)] }) : Promise.resolve(null);
    },
    discharges: rows<DischargeDraft>('discharges'), saveDischarge: (input: DischargeDraft) => save('discharges', input),
    appointments, addAppointment: (input: Omit<HospitalAppointment, 'id'>) => save('appointments', { ...input, id: undefined }),
    setApptStatus: (id: string, status: HospitalAppointment['status']) => {
      const row = appointments.find(item => item.id === id);
      return row ? save('appointments', { ...row, status }) : Promise.resolve(null);
    },
    consults: rows<HospitalConsult>('consults'), addConsult: (input: Omit<HospitalConsult, 'id'>) => save('consults', { ...input, id: undefined }),
    organization, membership, memberCount: context.data?.member_count ?? 0, isOrgAdmin: membership?.role === 'hospital_admin',
    updateOrganization, refreshOrg: context.refetch, loading: entries.isLoading, error: entries.error,
  };
}
