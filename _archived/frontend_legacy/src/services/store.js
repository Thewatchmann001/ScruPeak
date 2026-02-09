import create from 'zustand';
import { services } from './api';

// Parcel Store
export const useParcelStore = create((set) => ({
  parcels: [],
  selectedParcel: null,
  loading: false,
  error: null,

  fetchParcels: async (gridId) => {
    set({ loading: true, error: null });
    try {
      const response = await services.parcel.list(gridId);
      set({ parcels: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getParcel: async (parcelId) => {
    set({ loading: true });
    try {
      const response = await services.parcel.get(parcelId);
      set({ selectedParcel: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createParcel: async (data) => {
    set({ loading: true });
    try {
      const response = await services.parcel.create(data);
      set((state) => ({
        parcels: [...state.parcels, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getLineage: async (parcelId) => {
    try {
      const response = await services.parcel.lineage(parcelId);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getHistory: async (parcelId) => {
    try {
      const response = await services.parcel.history(parcelId);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clear: () => set({ parcels: [], selectedParcel: null, error: null }),
}));

// Grid Store
export const useGridStore = create((set) => ({
  grids: [],
  selectedGrid: null,
  statistics: null,
  loading: false,
  error: null,

  fetchGrids: async (level, parentId) => {
    set({ loading: true });
    try {
      const response = await services.grid.list(level, parentId);
      set({ grids: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getGrid: async (gridId) => {
    set({ loading: true });
    try {
      const response = await services.grid.get(gridId);
      set({ selectedGrid: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getStatistics: async (gridId) => {
    try {
      const response = await services.grid.statistics(gridId);
      set({ statistics: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getHierarchy: async () => {
    try {
      const response = await services.grid.hierarchy();
      set({ grids: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));

// Conflict Store
export const useConflictStore = create((set) => ({
  conflicts: [],
  selectedConflict: null,
  loading: false,
  error: null,

  fetchConflicts: async (gridId, resolved = false) => {
    set({ loading: true });
    try {
      const response = await services.conflict.list(gridId, resolved);
      set({ conflicts: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  detectConflicts: async (gridId) => {
    set({ loading: true });
    try {
      const response = await services.conflict.detect(gridId);
      set({ conflicts: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resolveConflict: async (conflictId, resolutionData) => {
    try {
      const response = await services.conflict.resolve(conflictId, resolutionData);
      set((state) => ({
        conflicts: state.conflicts.map((c) =>
          c.id === conflictId ? response.data : c
        ),
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));

// Ownership Store
export const useOwnershipStore = create((set) => ({
  ownership: [],
  loading: false,
  error: null,

  fetchOwnership: async (parcelId) => {
    set({ loading: true });
    try {
      const response = await services.ownership.list(parcelId);
      set({ ownership: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  transferOwnership: async (parcelId, transferData) => {
    try {
      const response = await services.ownership.transfer(parcelId, transferData);
      set((state) => ({
        ownership: [...state.ownership, response.data],
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));

export default {
  useParcelStore,
  useGridStore,
  useConflictStore,
  useOwnershipStore,
};
