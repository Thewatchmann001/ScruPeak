import { api } from './api';

export const paymentService = {
  createBuyerAccounts: async (buyerName: string) => {
    return api.post<{ sle_account: string; usd_account: string }>(
      '/api/v1/payments/monime/accounts',
      { buyer_name: buyerName }
    );
  },

  startCheckout: async (escrowId: string, currency: 'SLE' | 'USD') => {
    return api.post<{
      redirectUrl: string;
      sessionId: string;
      payment_id: string;
    }>('/api/v1/payments/monime/checkout', {
      escrow_id: escrowId,
      currency,
    });
  },

  payout: async (params: {
    source_account_id: string;
    destination: Record<string, any>;
    amount_minor: number;
    currency: 'SLE' | 'USD';
    description?: string;
  }) => {
    return api.post<{ payout: any }>(
      '/api/v1/payments/monime/payout',
      params
    );
  },

  internalTransfer: async (params: {
    from_account_id: string;
    to_account_id: string;
    amount_minor: number;
    currency: 'SLE' | 'USD';
    description?: string;
  }) => {
    return api.post<{ transfer: any }>(
      '/api/v1/payments/monime/transfer',
      params
    );
  },

  getReceipt: async (transactionId: string) => {
    return api.get<{ receipt: any }>(
      `/api/v1/payments/monime/receipt/${transactionId}`
    );
  },
};

