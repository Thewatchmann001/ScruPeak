import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
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

  // New Fields
  full_legal_name?: string;
  nin?: string;
  dob?: string;
  agency_name?: string;
  years_experience?: number;
  primary_region?: string;
  office_phone?: string;
  business_email?: string;
  background_check_auth?: boolean;
  digital_signature?: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentApplication | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await api.get<AgentApplication[]>('/api/v1/admin/agents/pending');
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
      await api.post(`/api/v1/admin/agents/${agentId}/verify`, {});
      toast.success('Agent verified successfully');
      // Refresh list
      fetchAgents();
      setSelectedAgent(null);
    } catch (error) {
      console.error('Failed to verify agent', error);
      toast.error('Failed to verify agent');
    }
  };

  const handleReject = async (agentId: string) => {
    const reason = window.prompt('Provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/api/v1/admin/agents/${agentId}/reject`, null, {
        params: { reason }
      });
      toast.success('Agent rejected successfully');
      fetchAgents();
      setSelectedAgent(null);
    } catch (error) {
      console.error('Failed to reject agent', error);
      toast.error('Failed to reject agent');
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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                  <tr
                    key={agent.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedAgent?.id === agent.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedAgent(agent)}
                  >
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
                        <Badge variant="outline" className="text-primary border-slate-200 bg-slate-50">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white mr-2"
                        onClick={(e) => { e.stopPropagation(); handleVerify(agent.id); }}
                        disabled={!agent.kyc_verified}
                        title={!agent.kyc_verified ? "User must complete KYC first" : "Approve Agent Application"}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleReject(agent.id); }}
                        title="Reject Agent Application"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedAgent ? (
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-4 border-b pb-2">Application Details</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500">Full Legal Name</p>
                  <p className="font-medium">{selectedAgent.full_legal_name || selectedAgent.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">NIN</p>
                    <p className="font-medium">{selectedAgent.nin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experience</p>
                    <p className="font-medium">{selectedAgent.years_experience} Years</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Agency / Office</p>
                  <p className="font-medium">{selectedAgent.agency_name || 'Independent'}</p>
                  <p className="text-xs text-gray-400">{selectedAgent.office_phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Region</p>
                  <p className="font-medium">{selectedAgent.primary_region || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-500 mb-1">Digital Signature</p>
                  <p className="font-serif italic text-lg">{selectedAgent.digital_signature}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Background Check Authorized
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerify(selectedAgent.id)}
                    disabled={!selectedAgent.kyc_verified}
                  >
                    Confirm & Verify
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleReject(selectedAgent.id)}
                  >
                    Reject Application
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-gray-400 border-dashed">
              Select an application to view details
            </Card>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
