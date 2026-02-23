export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "buyer" | "owner" | "agent" | "admin";
  kyc_verified: boolean;
  has_pending_agent_application?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LandClassification {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_state_land: boolean;
  created_at: string;
  updated_at: string;
}

export interface Land {
  id: string;
  ulid?: string;
  parcel_id?: string;
  spatial_id?: string;
  owner_id: string;
  title: string;
  description?: string;
  classification_id?: string;
  classification?: LandClassification;
  size_sqm: number;
  latitude: number;
  longitude: number;
  location: {
    latitude: number;
    longitude: number;
  };
  region: string;
  district: string;
  boundary?: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  status: "available" | "pending" | "sold" | "disputed";
  price?: number;
  documents: Document[];
  blockchain_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  land_id: string;
  document_type: string;
  file_url: string;
  file_hash: string;
  ai_fraud_score?: number;
  blockchain_hash?: string;
  verified_at?: string;
  created_at: string;
}

export interface Escrow {
  id: string;
  land_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: "pending" | "active" | "completed" | "cancelled";
  escrow_contract_address?: string;
  transaction_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender: User;
  message: string;
  attachments?: string[];
  contains_external_link: boolean;
  fraud_alert: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
