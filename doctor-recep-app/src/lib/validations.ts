import { z } from 'zod'

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Password must contain at least one special character.',
    })
    .trim(),
  clinic_name: z
    .string()
    .min(2, { message: 'Clinic name must be at least 2 characters long.' })
    .optional(),
  phone: z
    .string()
    .regex(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/, { message: 'Please enter a valid phone number.' })
    .optional(),
})

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
})

export const AdminLoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
})

export const ConsultationCreateSchema = z.object({
  primary_audio_url: z.string().url({ message: 'Valid audio URL is required.' }),
  additional_audio_urls: z.array(z.string().url()).optional().default([]),
  image_urls: z.array(z.string().url()).optional().default([]),
  submitted_by: z.enum(['doctor', 'receptionist']),
  total_file_size_bytes: z.number().min(0).optional(),
})

export const ConsultationUpdateSchema = z.object({
  edited_note: z.string().min(1, { message: 'Note content is required.' }),
})

export const TemplateConfigSchema = z.object({
  prescription_format: z.enum(['standard', 'detailed', 'minimal']),
  language: z.enum(['english', 'hindi', 'tamil', 'telugu', 'bengali']),
  tone: z.enum(['professional', 'friendly', 'formal']),
  sections: z.array(z.string()).min(1, { message: 'At least one section is required.' }),
})

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  clinic_name: z
    .string()
    .min(2, { message: 'Clinic name must be at least 2 characters long.' })
    .optional(),
  phone: z
    .string()
    .regex(/^[+]?[1-9][\d\s\-\(\)]{7,15}$/, { message: 'Please enter a valid phone number.' })
    .optional(),
  template_config: TemplateConfigSchema,
})

export type SignupFormData = z.infer<typeof SignupFormSchema>
export type LoginFormData = z.infer<typeof LoginFormSchema>
export type ConsultationCreateData = z.infer<typeof ConsultationCreateSchema>
export type ConsultationUpdateData = z.infer<typeof ConsultationUpdateSchema>
export type TemplateConfigData = z.infer<typeof TemplateConfigSchema>
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>
