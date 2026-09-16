import { request } from './api';
import { ChurnIntelligenceResponse } from '../types';
import { DEMO_CHURN } from '../data/demoData';

export async function fetchChurnIntelligence(): Promise<ChurnIntelligenceResponse> {
  return request<ChurnIntelligenceResponse>(
    '/api/churn',
    { method: 'GET' },
    DEMO_CHURN
  );
}
