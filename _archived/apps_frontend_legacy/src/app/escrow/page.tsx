'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface EscrowRecord {
  id: string;
  land_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  amount: number;
  status: 'pending' | 'active' | 'released' | 'disputed' | 'refunded';
  held_since: string;
  release_date?: string;
  dispute_reason?: string;
  documents?: string[];
}

/**
 * Escrow Management Page
 * Manages held funds, release conditions, and dispute handling
 */
export default function EscrowPage() {
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'released' | 'disputed' | 'refunded'>('all');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadEscrows();
  }, []);

  const loadEscrows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/api/v1/escrow/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const escrowsData = Array.isArray(response.data) ? response.data : response.data.escrows || [];
      
      const formattedEscrows: EscrowRecord[] = escrowsData.map((escrow: any) => ({
        id: escrow.id,
        land_id: escrow.land_id,
        buyer_id: escrow.buyer_id,
        seller_id: escrow.seller_id,
        buyer_name: escrow.buyer_name || 'Unknown Buyer',
        seller_name: escrow.seller_name || 'Unknown Seller',
        amount: escrow.amount || 0,
        status: escrow.status || 'pending',
        held_since: escrow.created_at || new Date().toISOString(),
        release_date: escrow.release_date,
        dispute_reason: escrow.dispute_reason,
        documents: escrow.documents || [],
      }));

      setEscrows(formattedEscrows);
    } catch (error: any) {
      console.error('Error loading escrows:', error);
      toast.error('Failed to load escrow records');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    if (!releaseReason.trim()) {
      toast.error('Please provide a reason for releasing funds');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/v1/escrow/${escrowId}/release`,
        { reason: releaseReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success('Escrow released successfully');
      setReleaseReason('');
      setShowDetails(false);
      loadEscrows();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to release escrow');
    }
  };

  const handleDisputeEscrow = async (escrowId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/v1/escrow/${escrowId}/dispute`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success('Dispute filed successfully');
      loadEscrows();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to file dispute');
    }
  };

  const filteredEscrows = escrows.filter(e => filter === 'all' || e.status === filter);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔒' },
      released: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      disputed: { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' },
      refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '↩️' },
    };
    return styles[status] || styles.pending;
  };

  // Calculate total held amount
  const totalHeld = escrows
    .filter(e => e.status === 'active' || e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔒 Escrow Management</h1>
          <p className="text-blue-100">Monitor and manage funds held in escrow for land transactions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total In Escrow', value: `₦${totalHeld.toLocaleString()}`, color: 'bg-blue-600', icon: '💰' },
            { label: 'Active Escrows', value: escrows.filter(e => e.status === 'active').length, color: 'bg-green-600', icon: '🟢' },
            { label: 'Pending Release', value: escrows.filter(e => e.status === 'pending').length, color: 'bg-yellow-600', icon: '⏳' },
            { label: 'Disputed', value: escrows.filter(e => e.status === 'disputed').length, color: 'bg-red-600', icon: '⚠️' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-lg p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'active', 'released', 'disputed', 'refunded'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Escrow Records */}
        {loading ? (
          <div className="text-center py-12 text-white">
            <p className="text-lg">Loading escrow records...</p>
          </div>
        ) : filteredEscrows.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg text-white">
            <p className="text-lg">No escrow records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEscrows.map((escrow) => {
              const statusStyle = getStatusStyle(escrow.status);
              const daysHeld = Math.floor(
                (new Date().getTime() - new Date(escrow.held_since).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={escrow.id}
                  className="bg-slate-800 rounded-lg shadow-lg hover:shadow-2xl transition-all p-6 border border-slate-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          Land ID: {escrow.land_id.substring(0, 12)}...
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-sm ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {statusStyle.icon} {escrow.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Escrow ID: <span className="font-mono">{escrow.id.substring(0, 8)}...</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 pb-6 border-b border-slate-700">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Buyer</p>
                      <p className="font-semibold text-white">{escrow.buyer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Seller</p>
                      <p className="font-semibold text-white">{escrow.seller_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Amount Held</p>
                      <p className="font-bold text-green-400 text-lg">₦{escrow.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Days Held</p>
                      <p className="font-bold text-blue-400 text-lg">{daysHeld} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Since</p>
                      <p className="text-gray-300 text-sm">
                        {formatDistanceToNow(new Date(escrow.held_since), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedEscrow(escrow);
                        setShowDetails(!showDetails);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      👁️ View Details
                    </button>

                    {escrow.status === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for releasing funds:');
                            if (reason) handleReleaseEscrow(escrow.id);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          💰 Release Funds
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter dispute reason:');
                            if (reason) handleDisputeEscrow(escrow.id, reason);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                        >
                          ⚠️ File Dispute
                        </button>
                      </>
                    )}

                    {escrow.status === 'disputed' && (
                      <button
                        onClick={() => {
                          toast.info('Dispute resolution interface coming soon');
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
                      >
                        🛟 Resolve Dispute
                      </button>
                    )}
                  </div>

                  {/* Dispute Reason */}
                  {escrow.dispute_reason && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded text-red-200">
                      <p className="text-sm font-semibold mb-1">⚠️ Dispute Reason:</p>
                      <p>{escrow.dispute_reason}</p>
                    </div>
                  )}

                  {/* Detailed View */}
                  {showDetails && selectedEscrow?.id === escrow.id && (
                    <div className="mt-6 p-4 bg-slate-700/50 rounded border border-slate-600">
                      <h4 className="text-white font-bold mb-4">📋 Escrow Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-xs">Buyer ID</p>
                          <p className="text-white font-mono text-sm break-all">{escrow.buyer_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Seller ID</p>
                          <p className="text-white font-mono text-sm break-all">{escrow.seller_id}</p>
                        </div>
                      </div>

                      {escrow.release_date && (
                        <div>
                          <p className="text-gray-400 text-xs">Scheduled Release</p>
                          <p className="text-white">
                            {new Date(escrow.release_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Release Reason Form */}
                      {escrow.status === 'active' && (
                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <label className="block text-gray-400 text-sm mb-2">Release Reason</label>
                          <textarea
                            value={releaseReason}
                            onChange={(e) => setReleaseReason(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 text-white rounded border border-slate-600 focus:border-blue-500"
                            rows={3}
                            placeholder="Describe why funds are being released..."
                          />
                          <button
                            onClick={() => handleReleaseEscrow(escrow.id)}
                            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                          >
                            ✅ Confirm Release
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
