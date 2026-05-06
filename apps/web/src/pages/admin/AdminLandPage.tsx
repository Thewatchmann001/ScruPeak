import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLandPage() {
  const [lands, setLands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const response = await api.get('/api/v1/land?status=pending_approval');
      setLands((response.data as any).items || []);
    } catch (error) {
      console.error('Failed to fetch pending lands', error);
      toast.error('Failed to load pending lands');
      setLands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (landId: string) => {
    try {
      await api.post(`/api/v1/admin/land/${landId}/approve`, {});
      toast.success('Land approved successfully');
      fetchLands();
    } catch (error) {
      console.error('Failed to approve land', error);
      toast.error('Failed to approve land');
    }
  };

  const handleReject = async (landId: string) => {
    const reason = window.prompt('Provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/api/v1/admin/land/${landId}/reject`, null, {
        params: { reason }
      });
      toast.success('Land rejected successfully');
      fetchLands();
    } catch (error) {
      console.error('Failed to reject land', error);
      toast.error('Failed to reject land');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Land Registry Management</h1>
        <Button onClick={fetchLands} variant="outline">Refresh List</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No pending land listings found.
                  </td>
                </tr>
              ) : lands.map((land) => (
                <tr key={land.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{land.title}</div>
                    <div className="text-xs text-gray-500">ID: {land.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{land.owner_name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{land.region}, {land.district}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${land.price?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => window.open(`/land/${land.id}`, '_blank')} className="text-primary hover:text-primary-700 mr-3" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleApprove(land.id)} className="text-green-600 hover:text-green-900 mr-3" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(land.id)} className="text-red-600 hover:text-red-900" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
