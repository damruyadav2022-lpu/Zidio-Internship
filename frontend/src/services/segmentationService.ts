import { request } from './api';
import { SegmentationResponse } from '../types';
import { DEMO_SEGMENTATION } from '../data/demoData';

export async function fetchSegmentation(): Promise<SegmentationResponse> {
  return request<SegmentationResponse>(
    '/api/segmentation',
    { method: 'GET' },
    DEMO_SEGMENTATION
  );
}
