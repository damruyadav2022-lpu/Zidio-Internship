import { request } from './api';
import { MLOpsResponse } from '../types';
import { DEMO_MLOPS } from '../data/demoData';

export async function fetchMLOpsObservability(): Promise<MLOpsResponse> {
  return request<MLOpsResponse>(
    '/api/mlops',
    { method: 'GET' },
    DEMO_MLOPS
  );
}

export async function triggerPipelineRun(): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(
    '/api/run-pipeline',
    { method: 'POST' },
    { status: 'success', message: 'Pipeline execution started in background' }
  );
}
