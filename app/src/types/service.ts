export interface ServiceCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  url?: string;
  api_endpoint?: string;
  pricing: ServicePricing;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePricing {
  model: 'free' | 'freemium' | 'paid' | 'enterprise';
  price?: number;
  currency?: string;
  period?: 'month' | 'year' | 'usage';
}

export type CreateServiceInput = Omit<ServiceCatalogEntry, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServiceInput = Partial<CreateServiceInput>;