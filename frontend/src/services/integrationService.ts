import { request } from './api';
import { IntegrationDirectoryPlatform, IntegrationItem, SmartCsvResult } from '../types';

export async function fetchIntegrationDirectory(): Promise<{ platforms: IntegrationDirectoryPlatform[] }> {
  return request<{ platforms: IntegrationDirectoryPlatform[] }>('/api/integrations/directory', { method: 'GET' }, {
    platforms: [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'E-Commerce',
        badge: '1-Click OAuth',
        description: 'Bi-directional sync of catalog SKUs, inventory buffers, and orders with automated webhook triggers.',
        logo: 'shopify',
        status: 'available',
        docs_url: 'https://shopify.dev'
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        category: 'E-Commerce',
        badge: 'REST API v3',
        description: 'Seamless integration for WordPress & WooCommerce stores via consumer key & secret.',
        logo: 'woocommerce',
        status: 'available',
        docs_url: 'https://woocommerce.com'
      },
      {
        id: 'amazon',
        name: 'Amazon Seller Central (SP-API)',
        category: 'Marketplace',
        badge: 'FBA / FBM',
        description: 'Sync Amazon inventory levels, FBA restock recommendations, and buy box price velocity.',
        logo: 'amazon',
        status: 'available',
        docs_url: 'https://developer-docs.amazon.com'
      }
    ]
  });
}

export async function fetchIntegrations(): Promise<{ integrations: IntegrationItem[] }> {
  return request<{ integrations: IntegrationItem[] }>('/api/integrations', { method: 'GET' }, {
    integrations: [
      {
        id: 1,
        organization_id: 1,
        store_id: 1,
        platform: 'Shopify',
        name: 'Shopify Flagship Sync',
        status: 'connected',
        config: { store_domain: 'acme-retail.myshopify.com' },
        last_sync_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        sync_frequency_minutes: 60,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        organization_id: 1,
        store_id: 2,
        platform: 'WooCommerce',
        name: 'WooCommerce Europe Sync',
        status: 'connected',
        config: { store_url: 'https://eu.acme-retail.com' },
        last_sync_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        sync_frequency_minutes: 60,
        created_at: new Date().toISOString()
      }
    ]
  });
}

export async function connectShopify(storeDomain: string, accessToken: string): Promise<any> {
  return request('/api/integrations/shopify/connect', {
    method: 'POST',
    body: JSON.stringify({ store_domain: storeDomain, access_token: accessToken })
  });
}

export async function triggerIntegrationSync(integrationId: number): Promise<any> {
  return request('/api/integrations/sync', {
    method: 'POST',
    body: JSON.stringify({ integration_id: integrationId })
  });
}

export async function uploadSmartCsv(file: File): Promise<SmartCsvResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/integrations/csv/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to upload and parse CSV');
  }

  return res.json();
}

export async function disconnectIntegration(integrationId: number): Promise<any> {
  return request(`/api/integrations/${integrationId}`, {
    method: 'DELETE'
  });
}

export async function connectAmazon(sellerId: string, lwaClientId: string, refreshToken: string, marketplaceId: string = 'ATVPDKIKX0DER'): Promise<any> {
  return request('/api/integrations/amazon/connect', {
    method: 'POST',
    body: JSON.stringify({
      seller_id: sellerId,
      lwa_client_id: lwaClientId,
      refresh_token: refreshToken,
      marketplace_id: marketplaceId
    })
  });
}

export async function connectWooCommerce(storeUrl: string, consumerKey: string, consumerSecret: string): Promise<any> {
  return request('/api/integrations/woocommerce/connect', {
    method: 'POST',
    body: JSON.stringify({
      store_url: storeUrl,
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    })
  });
}

export async function connectSquare(locationId: string, accessToken: string): Promise<any> {
  return request('/api/integrations/square/connect', {
    method: 'POST',
    body: JSON.stringify({
      location_id: locationId,
      access_token: accessToken
    })
  });
}

