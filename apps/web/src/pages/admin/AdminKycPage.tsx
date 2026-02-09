import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, FileText, Check, X } from 'lucide-react';

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch for now
    setTimeout(() => {
      setSubmissions([
        { id: '1', user: 'Joseph Emsamah', type: 'NIN', document_url: '#', status: 'pending', submitted_at: '2024-02-20' },
        { id: '2', user: 'Alice Wonderland', type: 'Passport', document_url: '#', status: 'pending', submitted_at: '2024-02-21' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
        {submissions.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{item.user}</h3>
                <p className="text-sm text-gray-500">{item.type}</p>
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
              Submitted: {item.submitted_at}
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
