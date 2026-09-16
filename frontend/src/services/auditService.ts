import { request } from './api';
import { AuditLogResponse } from '../types';

export async function fetchAuditLogs(limit = 50, actionFilter = 'all', search = ''): Promise<AuditLogResponse> {
  const query = new URLSearchParams();
  query.append('limit', limit.toString());
  if (actionFilter && actionFilter !== 'all') query.append('action_filter', actionFilter);
  if (search) query.append('search', search);

  const fallback: AuditLogResponse = {
    logs: [
      {
        id: 1,
        organization_id: 1,
        user_id: 1,
        user_email: 'evaluator@retailpulse.ai',
        action: 'user.login',
        resource: 'AuthService',
        details: 'User evaluator@retailpulse.ai logged in via web portal',
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      }
    ],
    total_count: 1,
    returned_count: 1
  };

  return request<AuditLogResponse>(`/api/audit-logs?${query.toString()}`, { method: 'GET' }, fallback);
}
