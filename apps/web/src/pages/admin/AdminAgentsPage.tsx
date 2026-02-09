import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AgentApplication {
  id: string;
  user_id: string;
  name: string;
  email: string;
  ministry_registration_number: string | null;
  wallet_address: string | null;
  created_at: string;
  kyc_verified: boolean;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/admin/agents/pending');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch pending agents', error);
      toast.error('Failed to fetch pending agents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (agentId: string) => {
    try {
      await api.post(`/admin/agents/${agentId}/verify`);
      toast.success('Agent verified successfully');
      // Refresh list
      fetchAgents();
    } catch (error) {
      console.error('Failed to verify agent', error);
      toast.error('Failed to verify agent');
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
        <div>
           <h1 className="text-2xl font-bold">Agent Applications</h1>
           <p className="text-gray-500">Review and approve real estate agent applications</p>
        </div>
        <Button onClick={fetchAgents} variant="outline">Refresh List</Button>
      </div>

      {agents.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No pending agent applications.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                          {agent.name?.charAt(0) || 'A'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-500">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Ministry ID:</span> {agent.ministry_registration_number || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                         <span className="font-medium">Wallet:</span> {agent.wallet_address ? `${agent.wallet_address.substring(0, 10)}...` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agent.kyc_verified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleVerify(agent.id)}
                        disabled={!agent.kyc_verified}
                        title={!agent.kyc_verified ? "User must complete KYC first" : "Approve Agent Application"}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
