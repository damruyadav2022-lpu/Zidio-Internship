import { request } from './api';
import { ApiKeyItem } from '../types';

export async function fetchApiKeys(): Promise<{ keys: ApiKeyItem[] }> {
  return request<{ keys: ApiKeyItem[] }>('/api/security/api-keys', { method: 'GET' }, { keys: [] });
}

export async function createApiKey(name: string, environment = 'live'): Promise<ApiKeyItem> {
  return request<ApiKeyItem>('/api/security/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name, environment })
  });
}

export async function revokeApiKey(keyId: number): Promise<any> {
  return request(`/api/security/api-keys/${keyId}`, {
    method: 'DELETE'
  });
}

export async function toggle2FA(enable: boolean): Promise<{ status: string; two_factor_enabled: boolean }> {
  return request('/api/security/2fa/toggle', {
    method: 'POST',
    body: JSON.stringify({ enable })
  });
}

export async function exportGdprData(): Promise<any> {
  return request('/api/security/gdpr/export', {
    method: 'POST'
  });
}
