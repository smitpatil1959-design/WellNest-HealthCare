export const hospitalAccess = Object.freeze({
  hospital_admin: ['patients', 'doctors', 'departments', 'admissions', 'reports', 'labs', 'discharges', 'appointments', 'consults'],
  hospital_doctor: ['patients', 'doctors', 'departments', 'admissions', 'reports', 'labs', 'discharges', 'appointments', 'consults'],
  hospital_receptionist: ['patients', 'doctors', 'departments', 'appointments'],
  hospital_nurse: ['patients', 'doctors', 'departments', 'admissions', 'appointments'],
  hospital_laboratory: ['patients', 'doctors', 'reports', 'labs'],
});
const writes = {
  hospital_admin: hospitalAccess.hospital_admin,
  hospital_doctor: ['reports', 'labs', 'discharges', 'consults', 'appointments'],
  hospital_receptionist: ['patients', 'appointments'],
  hospital_nurse: ['admissions', 'appointments'],
  hospital_laboratory: ['reports', 'labs'],
};
export const canWriteHospital = (role, kind) => Boolean(writes[role]?.includes(kind));
const fields = {
  patients: 'name dob sex phone email city emergencyName emergencyPhone bloodGroup allergies healthId',
  doctors: 'name specialty departmentId npi phone status available',
  departments: 'name floor head staff open',
  admissions: 'patientId doctorId departmentId room bed admitted expected status reason',
  reports: 'patientId title type date summary',
  labs: 'patientId doctorId test status requested',
  discharges: 'admissionId patientId diagnosis treatment procedures medication followUp instructions approved',
  appointments: 'patientId doctorId departmentId date time status reason',
  consults: 'patientId doctorId date diagnosis notes rx labs followUp',
};
const required = {
  patients: ['name', 'dob'], doctors: ['name'], departments: ['name'],
  admissions: ['patientId', 'room', 'bed', 'admitted'], reports: ['patientId', 'title', 'date'],
  labs: ['patientId', 'test'], discharges: ['patientId', 'admissionId'],
  appointments: ['patientId', 'doctorId', 'date', 'time'], consults: ['patientId', 'diagnosis', 'date'],
};
const enums = {
  doctors: { status: ['active', 'inactive', 'pending'] },
  admissions: { status: ['admitted', 'observation', 'pending-discharge', 'discharged'] },
  appointments: { status: ['upcoming', 'waiting', 'completed', 'canceled'] },
  labs: { status: ['requested', 'received', 'completed', 'reviewed', 'notified'] },
};
export function validateHospitalPayload(kind, input) {
  if (!fields[kind] || !input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Unsupported hospital entry.');
  const output = {};
  for (const key of fields[kind].split(' ')) {
    const value = input[key];
    if (value === undefined) continue;
    if (['available', 'open', 'approved'].includes(key)) {
      if (typeof value !== 'boolean') throw new Error(`${key} must be a boolean.`);
    } else if (key === 'staff') {
      if (!Number.isSafeInteger(value) || value < 0 || value > 100000) throw new Error('Invalid staff count.');
    } else if (['allergies', 'labs'].includes(key)) {
      if (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== 'string' || item.length > 200)) throw new Error(`Invalid ${key}.`);
    } else if (typeof value !== 'string' || value.length > (['notes', 'summary', 'treatment', 'instructions'].includes(key) ? 10000 : 2000)) {
      throw new Error(`Invalid ${key}.`);
    }
    output[key] = typeof value === 'string' ? value.trim() : value;
  }
  for (const key of required[kind]) if (!output[key]) throw new Error(`${key} is required.`);
  for (const key of ['dob', 'date', 'admitted', 'expected', 'requested']) {
    if (output[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(output[key]) || new Date(`${output[key]}T00:00:00Z`).toISOString().slice(0, 10) !== output[key])) throw new Error(`Invalid ${key}.`);
  }
  if (output.dob && output.dob > new Date().toISOString().slice(0, 10)) throw new Error('Date of birth cannot be in the future.');
  if (output.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(output.time)) throw new Error('Choose a valid time.');
  if (output.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email)) throw new Error('Enter a valid email address.');
  if (output.healthId) output.healthId = output.healthId.toUpperCase();
  for (const [key, values] of Object.entries(enums[kind] || {})) if (output[key] && !values.includes(output[key])) throw new Error(`Invalid ${key}.`);
  if (kind === 'discharges' && output.approved && (!output.diagnosis || !output.instructions)) throw new Error('Diagnosis and discharge instructions are required before release.');
  return output;
}
