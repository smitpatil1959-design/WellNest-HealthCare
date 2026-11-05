export type {
  UserRole,
  RoleCapability,
  RoleDefinition,
  RoleSessionPreview,
} from './roles';
export { USER_ROLES } from './roles';

export type MedicalStatus =
  | 'stable'
  | 'monitoring'
  | 'critical'
  | 'recovered'
  | 'pending'
  | 'verified';

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  organization: string;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  organization: string;
  role: string;
  message: string;
}

export type { AuthProfile, DeviceSession, NotificationPrefs } from './auth';
export { AUTH_ROLE_LABELS } from './auth';
