import { request } from './api';
import { BackgroundTask } from '../types';

export async function fetchTasks(limit = 20): Promise<{ tasks: BackgroundTask[] }> {
  return request<{ tasks: BackgroundTask[] }>(`/api/tasks?limit=${limit}`, { method: 'GET' }, { tasks: [] });
}

export async function fetchTaskStatus(taskId: string): Promise<BackgroundTask> {
  return request<BackgroundTask>(`/api/tasks/${taskId}`, { method: 'GET' });
}

export async function triggerTask(jobType: string, title?: string): Promise<{ status: string; task: BackgroundTask }> {
  return request('/api/tasks/trigger', {
    method: 'POST',
    body: JSON.stringify({ job_type: jobType, title })
  });
}
