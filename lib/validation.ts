import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type RegisterForm = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const createChildSchema = z.object({
  name: z.string().min(1, 'Enter a name').max(40),
  avatar: z.string().min(1, 'Pick an avatar'),
  ageGroup: z.enum(['AGE_3_4', 'AGE_5_6', 'AGE_7_9', 'AGE_10_12']),
});
export type CreateChildForm = z.infer<typeof createChildSchema>;
