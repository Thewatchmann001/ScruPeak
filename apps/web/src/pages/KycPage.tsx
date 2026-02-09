import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useNavigate } from 'react-router-dom';

const KycPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  const [files, setFiles] = useState<{
    id_document: File | null;
    proof_of_address: File | null;
    photo_straight: File | null;
    photo_left: File | null;
    photo_right: File | null;
  }>({
    id_document: null,
    proof_of_address: null,
    photo_straight: null,
    photo_left: null,
    photo_right: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/kyc', { replace: true });
      return;
    }

    // Check current KYC status
    const checkStatus = async () => {
      try {
        const response = await api.get('/kyc/status');
        if (response.data) {
          setKycStatus(response.data.status);
        }
      } catch (err) {
        // It's okay if 404 (no submission yet)
        console.log('No existing KYC submission or error fetching status');
      }
    };

    checkStatus();
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!files.id_document || !files.proof_of_address || !files.photo_straight || !files.photo_left || !files.photo_right) {
      setError('Please upload all required documents and photos.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('id_document', files.id_document);
    formData.append('proof_of_address', files.proof_of_address);
    formData.append('photo_straight', files.photo_straight);
    formData.append('photo_left', files.photo_left);
    formData.append('photo_right', files.photo_right);

    try {
      await api.post('/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('KYC documents submitted successfully! Your application is now under review.');
      setKycStatus('PENDING');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'APPROVED' || user?.kyc_verified) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-green-600">KYC Verified</CardTitle>
            <CardDescription>
              Congratulations! Your identity has been verified. You now have access to seller features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/sell')} className="bg-primary text-white">
                Go to Seller Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'PENDING') {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-blue-600">Verification Pending</CardTitle>
            <CardDescription>
              Your documents have been received and are currently under review by our admin team.
              This process usually takes 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Alert title="Under Review" className="bg-blue-50 border-blue-200">
               You will be notified once your verification status changes.
             </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Become a Verified Seller</CardTitle>
          <CardDescription>
            To list lands on LandBiznes, we need to verify your identity. Please upload the required documents below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" title="Error" className="mb-6">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" title="Success" className="mb-6">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">1. Identity Document</h3>
              <p className="text-sm text-gray-500">Upload a clear copy of your National ID, Passport, or Driver's License.</p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input 
                  id="id_document" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'id_document')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">2. Proof of Address</h3>
              <p className="text-sm text-gray-500">Upload a recent utility bill or bank statement (not older than 3 months).</p>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input 
                  id="proof_of_address" 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'proof_of_address')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">3. Live Photos</h3>
              <p className="text-sm text-gray-500">Please provide three photos of your face for liveness verification.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Straight Face</label>
                  <Input 
                    id="photo_straight" 
                    type="file" 
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange(e, 'photo_straight')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turn Left</label>
                  <Input 
                    id="photo_left" 
                    type="file" 
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange(e, 'photo_left')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turn Right</label>
                  <Input 
                    id="photo_right" 
                    type="file" 
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange(e, 'photo_right')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Verification Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycPage;
