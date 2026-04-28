import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, FileText, Check, X } from 'lucide-react';

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await api.get('/api/v1/admin/kyc/submissions?status=pending');
        setSubmissions((response.data as any[]) || []);
      } catch (error) {
        console.error('Failed to load KYC submissions', error);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleApprove = async (submissionId: string) => {
    setActioningId(submissionId);
    try {
      await api.post(`/api/v1/admin/kyc/submissions/${submissionId}/approve`, {});
      setSubmissions((prev) => prev.filter((item) => item.id !== submissionId));
    } catch (error) {
      console.error('Failed to approve KYC submission', error);
      alert('Failed to approve submission. Please try again.');
    } finally {
      setLoading(false);
      setActioningId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = window.prompt('Optional rejection reason:') || undefined;
    setActioningId(submissionId);
    try {
      await api.post(`/api/v1/admin/kyc/submissions/${submissionId}/reject`, null, {
        params: reason ? { reason } : {}
      });
      setSubmissions((prev) => prev.filter((item) => item.id !== submissionId));
    } catch (error) {
      console.error('Failed to reject KYC submission', error);
      alert('Failed to reject submission. Please try again.');
    } finally {
      setActioningId(null);
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
        <h1 className="text-2xl font-bold">KYC Verification Requests</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.length === 0 && (
          <Card className="p-6 md:col-span-2 lg:col-span-3">
            <p className="text-sm text-gray-500">No pending KYC submissions.</p>
          </Card>
        )}
        {submissions.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{item.user_name || 'Unknown User'}</h3>
                <p className="text-sm text-gray-500">{item.user_email || 'No email'}</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {item.status}
              </span>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Document Preview</span>
            </div>

            <div className="text-xs text-gray-400 mb-4">
              Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown'}
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={actioningId === item.id}
                onClick={() => handleApprove(item.id)}
              >
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={actioningId === item.id}
                onClick={() => handleReject(item.id)}
              >
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
