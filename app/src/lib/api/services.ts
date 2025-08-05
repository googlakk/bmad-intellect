import { ServiceCatalogEntry, CreateServiceInput, UpdateServiceInput } from '@/types/service';

const API_BASE = '/api';

export const servicesApi = {
  async getAll(category?: string): Promise<ServiceCatalogEntry[]> {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    
    const url = `${API_BASE}/services${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.services;
  },

  async getById(id: string): Promise<ServiceCatalogEntry> {
    const response = await fetch(`${API_BASE}/services/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Service not found');
      }
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.service;
  },

  async create(input: CreateServiceInput): Promise<ServiceCatalogEntry> {
    const response = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create service: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.service;
  },

  async update(id: string, input: UpdateServiceInput): Promise<ServiceCatalogEntry> {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update service: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.service;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete service: ${response.statusText}`);
    }
  },
};