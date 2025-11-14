import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ProductSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase().trim(),
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  categoryId: z.number().positive(),
  price: z.number().positive('Price must be positive'),
  size: z.string().max(50).trim().optional(),
  color: z.string().max(100).trim().optional(),
  gender: z.string().max(50).trim().optional(),
  stock: z.number().int().nonnegative('Stock cannot be negative').default(0),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;

export function validateLogin(data: unknown) {
  return LoginSchema.safeParse(data);
}

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}

export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email.toLowerCase().trim());
  return result.success;
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>\"'&]/g, (char) => {
    const map: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return map[char];
  });
}
