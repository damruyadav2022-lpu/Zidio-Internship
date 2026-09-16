import { request } from './api';
import { WebhookEndpoint } from '../types';

export async function sendPOEmail(payload: {
  po_number: string;
  supplier_name: string;
  supplier_email: string;
  total_amount: number;
  total_units: number;
  notes?: string;
}): Promise<any> {
  return request('/api/actions/send-po-email', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function testWebhook(webhookUrl: string, serviceType = 'slack'): Promise<any> {
  return request('/api/actions/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ webhook_url: webhookUrl, service_type: serviceType })
  });
}

export async function fetchWebhooks(): Promise<{ webhooks: WebhookEndpoint[] }> {
  return request<{ webhooks: WebhookEndpoint[] }>('/api/actions/webhooks', { method: 'GET' }, { webhooks: [] });
}

export async function createWebhook(payload: {
  name: string;
  service_type: string;
  target_url: string;
  events: string[];
}): Promise<any> {
  return request('/api/actions/webhooks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function syncRetentionKlaviyo(segmentName: string, serviceType = 'klaviyo', customerCount = 48): Promise<any> {
  return request('/api/actions/retention/sync-klaviyo', {
    method: 'POST',
    body: JSON.stringify({ segment_name: segmentName, service_type: serviceType, customer_count: customerCount })
  });
}
