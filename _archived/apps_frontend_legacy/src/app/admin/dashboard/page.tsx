'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { documentProcessor, type ExtractedPropertyData } from '@/services/aiDocumentProcessor';

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
}

interface AdminStats {
  total_properties: number;
  available: number;
  pending: number;
  sold: number;
  total_value: number;
}

/**
 * Enhanced Admin Dashboard
 * Property management with AI document processing
 */
export default function AdminDashboardEnhanced() {
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'verify' | 'analytics'>('add');
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_properties: 0,
    available: 0,
    pending: 0,
    sold: 0,
    total_value: 0,
  });
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    address: '',
    location: '',
    area_sqm: '',
    price: '',
    owner_name: '',
    status: 'available',
  });

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPropertyData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load properties and stats
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

      // Calculate stats
      const newStats: AdminStats = {
        total_properties: propsData.length,
        available: propsData.filter((p: any) => p.status === 'available').length,
        pending: propsData.filter((p: any) => p.status === 'pending').length,
        sold: propsData.filter((p: any) => p.status === 'sold').length,
        total_value: propsData.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'area_sqm' || name === 'price' ? parseFloat(value) || '' : value,
    }));
  }, []);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Validate form
      if (!formData.address || !formData.area_sqm || !formData.price) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/v1/land/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success(`Property added! Land ID: ${response.data.land_id}`);
      setFormData({
        address: '',
        location: '',
        area_sqm: '',
        price: '',
        owner_name: '',
        status: 'available',
      });

      loadProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, JPEG, PNG, DOC, or DOCX');
        return;
      }

      setUploadedFile(file);
      setExtractedData(null);
      setValidation(null);
    }
  };

  const handleProcessDocument = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    try {
      const extracted = await documentProcessor.processDocument(uploadedFile);
      setExtractedData(extracted);

      // Validate extracted data
      const validationResult = documentProcessor.validateExtractedData(extracted);
      setValidation(validationResult);

      if (validationResult.isValid) {
        toast.success('Document processed successfully!');
      } else {
        toast.warning(`Document processed with ${validationResult.errors.length} issues`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePropertyFromExtracted = async () => {
    if (!extractedData || !validation?.isValid) {
      toast.error('Please process a valid document first');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const propertyData = {
        address: extractedData.address || '',
        location: extractedData.location || '',
        area_sqm: extractedData.area_sqm || 0,
        price: extractedData.price || 0,
        owner_name: extractedData.owner_name || '',
        status: 'available',
        coordinates: extractedData.coordinates,
        description: extractedData.extracted_fields?.description,
      };

      const response = await axios.post(
        `${API_BASE}/api/v1/land/`,
        propertyData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success(`Property created from document! Land ID: ${response.data.land_id}`);
      setExtractedData(null);
      setUploadedFile(null);
      loadProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/v1/land/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success('Property deleted');
      loadProperties();
    } catch (error: any) {
      toast.error('Failed to delete property');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏢 Admin Dashboard</h1>
          <p className="text-blue-100">Manage properties and process documents</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Properties', value: stats.total_properties, color: 'bg-blue-600', icon: '📊' },
            { label: 'Available', value: stats.available, color: 'bg-green-600', icon: '✅' },
            { label: 'Pending', value: stats.pending, color: 'bg-yellow-600', icon: '⏳' },
            { label: 'Sold', value: stats.sold, color: 'bg-red-600', icon: '🔴' },
            { label: 'Total Value', value: `₦${(stats.total_value / 1000000).toFixed(1)}M`, color: 'bg-purple-600', icon: '💰' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-lg p-4 text-white`}>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xl mt-1">{stat.icon}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-800 rounded-lg p-2">
          {(['add', 'list', 'verify', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {tab === 'add' && '➕ Add Property'}
              {tab === 'list' && '📋 View Properties'}
              {tab === 'verify' && '🤖 AI Processing'}
              {tab === 'analytics' && '📈 Analytics'}
            </button>
          ))}
        </div>

        {/* Add Property Tab */}
        {activeTab === 'add' && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Property</h2>

            <form onSubmit={handleAddProperty} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Plot 123, Lekki Phase 1"
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Lagos, Nigeria"
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Area (m²) *</label>
                  <input
                    type="number"
                    name="area_sqm"
                    value={formData.area_sqm}
                    onChange={handleInputChange}
                    placeholder="2500"
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Price (₦) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="5000000"
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Owner Name</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-600 rounded focus:border-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-500 font-semibold transition-all"
              >
                {loading ? '⏳ Adding...' : '✅ Add Property'}
              </button>
            </form>
          </div>
        )}

        {/* View Properties Tab */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Properties ({properties.length})</h2>

            {properties.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-lg text-gray-400">
                No properties yet
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map((prop) => (
                  <div key={prop.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{prop.address}</h3>
                        <p className="text-gray-400">📍 {prop.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        prop.status === 'available' ? 'bg-green-600' :
                        prop.status === 'pending' ? 'bg-yellow-600' :
                        'bg-red-600'
                      } text-white`}>
                        {prop.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Area</p>
                        <p className="font-bold text-white">{prop.area_sqm.toLocaleString()} m²</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="font-bold text-green-400">₦{prop.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Owner</p>
                        <p className="font-bold text-white">{prop.owner_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Land ID</p>
                        <p className="font-mono text-blue-400 text-sm">{prop.land_id.substring(0, 8)}...</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProperty(prop.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Document Processing Tab */}
        {activeTab === 'verify' && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">🤖 AI Document Processing</h2>

            {/* File Upload */}
            <div className="mb-8">
              <div className="border-2 border-dashed border-blue-500 rounded-lg p-8 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-white font-semibold mb-2">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-gray-400 text-sm">PDF, JPEG, PNG, DOC, DOCX supported</p>
                </label>
              </div>
            </div>

            {/* Process Button */}
            {uploadedFile && !extractedData && (
              <button
                onClick={handleProcessDocument}
                disabled={isProcessing}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500 font-semibold transition-all mb-8"
              >
                {isProcessing ? '⏳ Processing...' : '🚀 Process Document'}
              </button>
            )}

            {/* Extracted Data Display */}
            {extractedData && (
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-lg font-bold text-white mb-4">Extracted Information</h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-white font-semibold">{extractedData.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-white font-semibold">{extractedData.location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Area (m²)</p>
                      <p className="text-white font-semibold">{extractedData.area_sqm || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="text-green-400 font-bold">₦{extractedData.price?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Owner Name</p>
                      <p className="text-white font-semibold">{extractedData.owner_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Confidence</p>
                      <div className="w-full bg-slate-600 rounded h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded"
                          style={{ width: `${(extractedData.confidence || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Results */}
                  {validation && (
                    <div className={`p-4 rounded mb-6 ${
                      validation.isValid ? 'bg-green-900/30 border border-green-600' : 'bg-yellow-900/30 border border-yellow-600'
                    }`}>
                      <p className={`font-semibold mb-2 ${validation.isValid ? 'text-green-400' : 'text-yellow-400'}`}>
                        {validation.isValid ? '✅ Valid Data' : '⚠️ Validation Issues'}
                      </p>
                      {validation.errors.length > 0 && (
                        <ul className="text-sm text-gray-300 space-y-1">
                          {validation.errors.map((error: string, idx: number) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCreatePropertyFromExtracted}
                    disabled={!validation?.isValid || loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-500 font-semibold"
                  >
                    {loading ? '⏳ Creating...' : '✅ Create Property'}
                  </button>
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setUploadedFile(null);
                    }}
                    className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-semibold"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Analytics</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4">Property Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-green-400">Available</span>
                      <span className="font-bold text-white">{stats.available} ({((stats.available / stats.total_properties) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded h-2">
                      <div className="bg-green-600 h-2 rounded" style={{ width: `${(stats.available / stats.total_properties) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-yellow-400">Pending</span>
                      <span className="font-bold text-white">{stats.pending} ({((stats.pending / stats.total_properties) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded h-2">
                      <div className="bg-yellow-600 h-2 rounded" style={{ width: `${(stats.pending / stats.total_properties) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-red-400">Sold</span>
                      <span className="font-bold text-white">{stats.sold} ({((stats.sold / stats.total_properties) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded h-2">
                      <div className="bg-red-600 h-2 rounded" style={{ width: `${(stats.sold / stats.total_properties) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4">Portfolio Value</h3>
                <p className="text-3xl font-bold text-green-400 mb-2">₦{(stats.total_value / 1000000).toFixed(1)}M</p>
                <p className="text-gray-400 text-sm">Total portfolio value across all properties</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
