import { api } from './api';

export interface SignatureRequest {
  id: string;
  document_name: string;
  document_type: string;
  status: 'created' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';
  signers_count: number;
  signed_count: number;
  expires_at?: string;
}

export interface SignatureField {
  id: string;
  page_number: number;
  x_coordinate: number;
  y_coordinate: number;
  width: number;
  height: number;
  field_name: string;
  signer_id: string;
  is_signed: boolean;
}

export const signatureService = {
  // Create a new signature request
  createRequest: async (data: {
    document_id: string;
    document_name: string;
    signers: { email: string; name: string }[];
    fields: any[];
  }) => {
    return api.post<SignatureRequest>('/signatures/request', data);
  },

  // Get all pending signatures for the current user
  getMyPending: async () => {
    return api.get<SignatureRequest[]>('/signatures/my-pending');
  },

  // Get details of a specific request
  getRequest: async (id: string) => {
    return api.get<SignatureRequest>(`/signatures/request/${id}`);
  },

  // Sign a specific field
  signField: async (requestId: string, fieldId: string, signatureValue: string) => {
    return api.post<{ status: string }>(`/signatures/request/${requestId}/sign`, {
      field_id: fieldId,
      signature_value: signatureValue
    });
  },

  // Seal the document (finalize)
  sealDocument: async (requestId: string) => {
    return api.post<{ certificate_number: string; status: string }>(
      `/signatures/request/${requestId}/seal`, 
      {}
    );
  },
  
  // Download the signed certificate
  getCertificate: async (certId: string) => {
    return api.get(`/signatures/certificate/${certId}`);
  }
};
