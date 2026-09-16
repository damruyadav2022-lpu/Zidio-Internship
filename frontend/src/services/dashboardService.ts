import { request } from './api';
import { DashboardOverviewResponse, DateRange } from '../types';
import { DEMO_OVERVIEW } from '../data/demoData';

export async function fetchDashboardOverview(dateRange: DateRange = '30d'): Promise<DashboardOverviewResponse> {
  return request<DashboardOverviewResponse>(
    `/api/overview?date_range=${dateRange}`,
    { method: 'GET' },
    { ...DEMO_OVERVIEW, date_range: dateRange }
  );
}
