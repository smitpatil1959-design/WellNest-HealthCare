export type RxSource = 'doctor' | 'hospital' | 'patient';
export type RxStatus = 'pending' | 'verifying' | 'processing' | 'ready' | 'completed' | 'cancelled';
export type PharmacyStaffRole = 'pharmacist-in-charge' | 'pharmacist' | 'technician' | 'cashier';

export interface PharmacyOrg {
  name: string;
  legalName: string;
  license: string;
  ncpdp: string;
  address: string;
  phone: string;
  hours: string;
  verified: boolean;
  logo: string;
}

export interface PharmacyRx {
  id: string;
  rxNumber: string;
  patientName: string;
  patientId: string;
  dob: string;
  allergies: string[];
  doctor: string;
  hospital: string;
  source: RxSource;
  status: RxStatus;
  medicine: string;
  dosage: string;
  quantity: string;
  refills: number;
  sig: string;
  written: string;
  received: string;
  notes: string;
  interactions: string[];
  verifier?: string;
  verifiedAt?: string;
}

export interface InventoryItem {
  id: string;
  version?: number;
  name: string;
  sku: string;
  form: string;
  strength: string;
  onHand: number;
  reorder: number;
  expires: string;
  lot: string;
  controlled: boolean;
}

export interface PharmacyOrder {
  id: string;
  rxId: string;
  status: RxStatus;
  promised: string;
  pickupCode: string;
}

export interface PharmacyNotice {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'rx' | 'stock' | 'safety' | 'pickup';
  href: string;
}
