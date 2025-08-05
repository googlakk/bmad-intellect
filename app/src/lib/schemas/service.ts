import { z } from 'zod';

export const servicePricingSchema = z.object({
  model: z.enum(['free', 'freemium', 'paid', 'enterprise']),
  price: z.number().optional(),
  currency: z.string().optional(),
  period: z.enum(['month', 'year', 'usage']).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, 'Название сервиса обязательно').max(200),
  description: z.string().min(1, 'Описание обязательно').max(1000),
  category: z.string().min(1, 'Категория обязательна'),
  url: z.string().url('Некорректный URL').optional(),
  api_endpoint: z.string().url('Некорректный API endpoint').optional(),
  pricing: servicePricingSchema,
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;