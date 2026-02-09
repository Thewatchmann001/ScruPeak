import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Microservices API clients
export const services = {
  // Parcel Service
  parcel: {
    list: (gridId, limit = 100) =>
      apiClient.get('/parcels', { params: { grid_id: gridId, limit } }),
    get: (parcelId) =>
      apiClient.get(`/parcels/${parcelId}`),
    create: (data) =>
      apiClient.post('/parcels', data),
    update: (parcelId, data) =>
      apiClient.put(`/parcels/${parcelId}`, data),
    search: (query) =>
      apiClient.get('/parcels/search', { params: { q: query } }),
    spatial: (geometry) =>
      apiClient.post('/parcels/spatial-query', { geometry }),
    lineage: (parcelId) =>
      apiClient.get(`/parcels/${parcelId}/lineage`),
    history: (parcelId) =>
      apiClient.get(`/parcels/${parcelId}/history`),
  },

  // Grid Service
  grid: {
    list: (level, parentId) =>
      apiClient.get('/grids', { params: { level, parent_id: parentId } }),
    get: (gridId) =>
      apiClient.get(`/grids/${gridId}`),
    create: (data) =>
      apiClient.post('/grids', data),
    statistics: (gridId) =>
      apiClient.get(`/grids/${gridId}/statistics`),
    hierarchy: () =>
      apiClient.get('/grids/hierarchy'),
  },

  // Conflict Service
  conflict: {
    list: (gridId, resolved = false) =>
      apiClient.get('/conflicts', { params: { grid_id: gridId, resolved } }),
    get: (conflictId) =>
      apiClient.get(`/conflicts/${conflictId}`),
    detect: (gridId) =>
      apiClient.post(`/conflicts/detect/${gridId}`),
    resolve: (conflictId, data) =>
      apiClient.put(`/conflicts/${conflictId}/resolve`, data),
  },

  // Ownership Service
  ownership: {
    list: (parcelId) =>
      apiClient.get('/ownership', { params: { parcel_id: parcelId } }),
    current: (parcelId) =>
      apiClient.get(`/ownership/${parcelId}/current`),
    transfer: (parcelId, data) =>
      apiClient.post(`/ownership/${parcelId}/transfer`, data),
    history: (parcelId) =>
      apiClient.get(`/ownership/${parcelId}/history`),
  },

  // Owner Service
  owner: {
    list: () =>
      apiClient.get('/owners'),
    get: (ownerId) =>
      apiClient.get(`/owners/${ownerId}`),
    create: (data) =>
      apiClient.post('/owners', data),
    portfolio: (ownerId) =>
      apiClient.get(`/owners/${ownerId}/portfolio`),
  },
};

export default apiClient;
