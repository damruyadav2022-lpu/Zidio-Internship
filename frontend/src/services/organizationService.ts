import { request } from './api';
import { OrganizationResponse, Store } from '../types';

export async function fetchCurrentOrganization(): Promise<OrganizationResponse> {
  const fallback: OrganizationResponse = {
    organization: {
      id: 1,
      name: 'Acme Retail Brands Inc.',
      slug: 'acme-retail-brands',
      plan_id: 'growth',
      created_at: new Date().toISOString()
    },
    stores: [
      {
        id: 1,
        organization_id: 1,
        name: 'Acme Flagship Online',
        platform: 'Shopify',
        domain: 'acme-retail.myshopify.com',
        currency: 'USD',
        timezone: 'America/New_York',
        is_active: 1,
        is_live: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        organization_id: 1,
        name: 'Acme European Outlet',
        platform: 'WooCommerce',
        domain: 'eu.acme-retail.com',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        is_active: 1,
        is_live: 1,
        created_at: new Date().toISOString()
      }
    ],
    members: [
      {
        id: 1,
        user_id: 1,
        name: 'Project Evaluator',
        email: 'evaluator@retailpulse.ai',
        role: 'owner',
        title: 'VP of Retail Operations',
        joined_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 2,
        name: 'System Admin',
        email: 'admin@retailpulse.ai',
        role: 'admin',
        title: 'Lead Architect',
        joined_at: new Date().toISOString()
      }
    ]
  };

  return request<OrganizationResponse>('/api/organizations/current', { method: 'GET' }, fallback);
}

export async function createStore(payload: { name: string; platform: string; domain?: string; currency?: string }): Promise<any> {
  return request('/api/organizations/stores', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function toggleStoreMode(storeId: number): Promise<{ is_live: boolean; mode_label: string }> {
  return request(`/api/organizations/stores/${storeId}/toggle-mode`, {
    method: 'POST'
  }, { is_live: true, mode_label: 'Live Store' });
}

export async function inviteOrganizationMember(payload: { name: string; email: string; role: string; title?: string }): Promise<any> {
  return request('/api/organizations/members/invite', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function removeOrganizationMember(memberId: number): Promise<any> {
  return request(`/api/organizations/members/${memberId}`, {
    method: 'DELETE'
  });
}
