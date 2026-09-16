import { request } from './api';
import { PaginatedCustomersResponse, CustomerDetail } from '../types';
import { DEMO_CUSTOMERS, DEMO_CUSTOMER_DETAIL } from '../data/demoData';

export interface CustomerQueryParams {
  q?: string;
  segment?: string;
  risk?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export async function fetchCustomers(params: CustomerQueryParams = {}): Promise<PaginatedCustomersResponse> {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.segment && params.segment !== 'All') query.append('segment', params.segment);
  if (params.risk && params.risk !== 'All') query.append('risk', params.risk);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.order) query.append('order', params.order);

  // In demo mode, filter client-side if needed
  let fallback = { ...DEMO_CUSTOMERS };
  if (params.segment && params.segment !== 'All') {
    fallback.items = fallback.items.filter(c => c.Segment === params.segment);
    fallback.total = fallback.items.length;
  }
  if (params.risk && params.risk !== 'All') {
    fallback.items = fallback.items.filter(c => c.ChurnRiskLevel === params.risk);
    fallback.total = fallback.items.length;
  }
  if (params.q) {
    const qLower = params.q.toLowerCase();
    fallback.items = fallback.items.filter(c => 
      c.CustomerName.toLowerCase().includes(qLower) || 
      c.CustomerID.toLowerCase().includes(qLower)
    );
    fallback.total = fallback.items.length;
  }

  return request<PaginatedCustomersResponse>(
    `/api/customers?${query.toString()}`,
    { method: 'GET' },
    fallback
  );
}

export async function fetchCustomerDetail(customerId: string): Promise<CustomerDetail> {
  return request<CustomerDetail>(
    `/api/customers/${customerId}`,
    { method: 'GET' },
    { ...DEMO_CUSTOMER_DETAIL, CustomerID: customerId }
  );
}
