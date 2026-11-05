import { z } from 'zod';
import { USER_ROLES } from '../../types/roles';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  remember: z.boolean(),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    organization: z.string().max(200).optional().or(z.literal('')),
    role: z.enum(USER_ROLES),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include a letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    accept: z.boolean().refine((value) => value, 'You must accept the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include a letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const otpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z.string().min(6, 'Enter the 6-digit code').max(8, 'Code is too long'),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  organization: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(24, 'Phone is too long').optional().or(z.literal('')),
  language: z.string().min(2),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  professionalTitle: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
