'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  escrow_id: string;
  property_id: string;
  buyer: string;
  seller: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  property_address?: string;
}

/**
 * Transaction History Page
 * Shows all land sales transactions with buyer/seller info and escrow status
 */
export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
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

      // Mock data transformation - in production this would come from backend
      const transactionsData = Array.isArray(response.data) ? response.data : response.data.transactions || [];
      
      const formattedTransactions: Transaction[] = transactionsData.map((tx: any) => ({
        id: tx.id,
        escrow_id: tx.id,
        property_id: tx.land_id || '',
        buyer: tx.buyer_name || 'Unknown Buyer',
        seller: tx.seller_name || 'Unknown Seller',
        amount: tx.amount || 0,
        status: tx.status || 'pending',
        created_at: tx.created_at || new Date().toISOString(),
        updated_at: tx.updated_at || new Date().toISOString(),
        property_address: tx.property_address,
      }));

      setTransactions(formattedTransactions);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.status === filter;
    const matchesSearch = searchTerm === '' || 
      tx.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.property_address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get status color and icon
  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      active: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💼 Transaction History</h1>
          <p className="text-gray-600">View all land sales, escrow status, and transaction details</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Transactions', value: transactions.length, color: 'bg-blue-500' },
            { label: 'Pending', value: transactions.filter(t => t.status === 'pending').length, color: 'bg-yellow-500' },
            { label: 'Active (In Escrow)', value: transactions.filter(t => t.status === 'active').length, color: 'bg-blue-500' },
            { label: 'Completed', value: transactions.filter(t => t.status === 'completed').length, color: 'bg-green-500' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.color} rounded-lg p-6 text-white`}>
              <p className="text-sm opacity-90">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by buyer, seller, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadTransactions}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'active', 'completed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const statusStyle = getStatusStyle(transaction.status);
              const totalAmount = transaction.amount || 0;

              return (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {transaction.property_address || 'Property Transaction'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Transaction ID: <span className="font-mono">{transaction.id.substring(0, 8)}...</span>
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full font-semibold text-sm ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.icon} {transaction.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Buyer</p>
                      <p className="font-semibold text-gray-900">👤 {transaction.buyer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Seller</p>
                      <p className="font-semibold text-gray-900">👤 {transaction.seller}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Amount</p>
                      <p className="font-bold text-green-600 text-lg">₦{totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Created</p>
                      <p className="text-gray-900 font-medium">
                        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        toast.success(`Opening transaction details for ${transaction.id}`);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium"
                    >
                      👁️ View Details
                    </button>
                    {transaction.status === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            toast.success('Opening escrow details...');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                        >
                          🔒 Escrow Details
                        </button>
                        <button
                          onClick={() => {
                            toast.info('Release funds functionality coming soon');
                          }}
                          className="px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 font-medium"
                        >
                          💰 Release Funds
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
