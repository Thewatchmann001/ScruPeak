'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';

interface Property {
  id: string;
  land_id: string;
  address: string;
  location: string;
  area_sqm: number;
  price: number;
  status: 'available' | 'pending' | 'sold';
  owner_id: string;
  owner_name: string;
  coordinates?: { latitude: number; longitude: number };
  description?: string;
  images?: string[];
  created_at: string;
}

/**
 * Property Listing Page
 * Browse available land properties with search, filter, and sorting
 */
export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    status: 'available',
    minPrice: 0,
    maxPrice: 100000000,
    minArea: 0,
    maxArea: 100000,
    search: '',
  });
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'area-asc' | 'area-desc' | 'newest'>('newest');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/v1/land/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const propsData = Array.isArray(response.data) ? response.data : response.data.properties || [];
      setProperties(propsData);
    } catch (error: any) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort properties
  let filteredProperties = properties.filter(prop => {
    return (
      prop.status === filters.status &&
      prop.price >= filters.minPrice &&
      prop.price <= filters.maxPrice &&
      prop.area_sqm >= filters.minArea &&
      prop.area_sqm <= filters.maxArea &&
      (prop.address.toLowerCase().includes(filters.search.toLowerCase()) ||
        prop.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        prop.owner_name.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  // Sort properties
  filteredProperties = [...filteredProperties].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'area-asc':
        return a.area_sqm - b.area_sqm;
      case 'area-desc':
        return b.area_sqm - a.area_sqm;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.available;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏘️ Land Properties</h1>
          <p className="text-gray-600">Browse available land for sale</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by location, owner, or address..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price Range: ₦{filters.minPrice.toLocaleString()} - ₦{filters.maxPrice.toLocaleString()}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Area Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Area: {filters.minArea} - {filters.maxArea} m²
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min m²"
                  value={filters.minArea}
                  onChange={(e) => setFilters({ ...filters, minArea: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  placeholder="Max m²"
                  value={filters.maxArea}
                  onChange={(e) => setFilters({ ...filters, maxArea: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="area-asc">Area: Small to Large</option>
                <option value="area-desc">Area: Large to Small</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewType('grid')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewType === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewType === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ≡ List
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-6 font-semibold">
          Found {filteredProperties.length} properties
        </p>

        {/* Properties Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No properties match your filters</p>
          </div>
        ) : viewType === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
                onClick={() => setViewingProperty(prop)}
              >
                {/* Property Image */}
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-3xl">
                  {prop.images?.[0] ? (
                    <img src={prop.images[0]} alt={prop.address} className="w-full h-full object-cover" />
                  ) : (
                    '🏞️'
                  )}
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{prop.address}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(prop.status)}`}>
                      {prop.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">📍 {prop.location}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 py-2 border-t border-b">
                    <div>
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-bold">{prop.area_sqm.toLocaleString()} m²</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Land ID</p>
                      <p className="font-bold text-blue-600">{prop.land_id.substring(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="font-semibold text-gray-900">{prop.owner_name}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-green-600">₦{prop.price.toLocaleString()}</p>
                    <Link
                      href={`/land/${prop.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex gap-6 cursor-pointer"
                onClick={() => setViewingProperty(prop)}
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-green-400 rounded flex-shrink-0 flex items-center justify-center text-white text-2xl">
                  {prop.images?.[0] ? (
                    <img src={prop.images[0]} alt={prop.address} className="w-full h-full object-cover rounded" />
                  ) : (
                    '🏞️'
                  )}
                </div>

                {/* Property Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{prop.address}</h3>
                      <p className="text-gray-600">📍 {prop.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(prop.status)}`}>
                      {prop.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 my-3">
                    <div>
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-bold">{prop.area_sqm.toLocaleString()} m²</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Land ID</p>
                      <p className="font-bold text-blue-600">{prop.land_id.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Owner</p>
                      <p className="font-semibold">{prop.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-bold text-green-600 text-lg">₦{prop.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/land/${prop.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Make offer coming soon');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    >
                      Make Offer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick View Modal */}
        {viewingProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{viewingProperty.address}</h2>
                  <button
                    onClick={() => setViewingProperty(null)}
                    className="text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{viewingProperty.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingProperty.status)}`}>
                      {viewingProperty.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-semibold">{viewingProperty.area_sqm.toLocaleString()} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Owner</p>
                    <p className="font-semibold">{viewingProperty.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Land ID</p>
                    <p className="font-mono font-semibold text-blue-600">{viewingProperty.land_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-bold text-green-600 text-lg">₦{viewingProperty.price.toLocaleString()}</p>
                  </div>
                </div>

                {viewingProperty.description && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-800">{viewingProperty.description}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/land/${viewingProperty.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 font-medium"
                  >
                    Full Details
                  </Link>
                  <button
                    onClick={() => {
                      toast.info('Make offer coming soon');
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    Make Offer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
