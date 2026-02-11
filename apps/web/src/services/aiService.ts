import { api } from './api';

export interface LanstimateResult {
  success: boolean;
  estimated_price: number;
  price_range: [number, number];
  confidence_score: number;
  valuation_factors: string[];
  market_trend: string;
  disclaimer: string;
}

export const aiService = {
  getLanstimate: async (data: {
    location: {
      district: string;
      chiefdom: string;
      community: string;
    };
    size_sqm: number;
    purpose: string;
  }) => {
    const response = await api.post<LanstimateResult>('/ai/lanstimate', data);
    return response.data;
  },

  getGuidance: async (question: string, context?: any) => {
    const response = await api.post<any>('/ai/land-guidance', { question, context });
    return response.data;
  }
};
