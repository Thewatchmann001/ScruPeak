import { api } from './api';
import { Land, LandClassification, PaginatedResponse } from '@/types';

export const landService = {
  getClassifications: async () => {
    return api.get<LandClassification[]>('/api/v1/registry/classifications');
  },

  search: async (params: {
    q?: string;
    status?: string;
    min_price?: number;
    max_price?: number;
    region?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    return api.get<PaginatedResponse<Land>>(`/api/v1/land?${queryParams.toString()}`);
  },

  getTaskStatus: async (taskId: string) => {
    return api.get<{
      task_id: string;
      status: string;
      result?: any;
      error?: string;
    }>(`/api/v1/tasks/${taskId}`);
  },

  publishNotice: async (landId: string) => {
    return api.post<Land>(`/api/v1/land/${landId}/publish-notice`, {});
  },

  lodgeObjection: async (landId: string, reason: string, evidenceUrl?: string) => {
    const params = new URLSearchParams();
    params.append('reason', reason);
    if (evidenceUrl) params.append('evidence_url', evidenceUrl);
    
    return api.post<{ message: string, dispute_id: string }>(
      `/api/v1/land/${landId}/objection?${params.toString()}`, 
      {}
    );
  }
};
