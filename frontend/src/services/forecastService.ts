import { request } from './api';
import { ForecastingResponse } from '../types';
import { DEMO_FORECASTING } from '../data/demoData';

export async function fetchForecasting(
  category = 'All',
  model = 'lstm',
  horizon = 30
): Promise<ForecastingResponse> {
  return request<ForecastingResponse>(
    `/api/forecasting?category=${encodeURIComponent(category)}&model=${encodeURIComponent(model)}&horizon=${horizon}`,
    { method: 'GET' },
    { ...DEMO_FORECASTING, selected_model: model, horizon, category }
  );
}
