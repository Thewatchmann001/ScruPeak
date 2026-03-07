import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

const RoleApplicationPage = () => {
  const { user, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState({
    ministry_registration_number: '',
    wallet_address: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/apply-role', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSellerUpgrade = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post('/users/upgrade/seller');
      setSuccess('Successfully upgraded to Seller (Owner) role! You can now list your land.');
      await checkAuth(); // Refresh user state
      // Redirect after short delay
      setTimeout(() => {
        navigate('/sell');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('KYC')) {
        setError('KYC Verification is required to become a seller. Please complete KYC first.');
      } else {
        setError(err.response?.data?.detail || 'Failed to upgrade to seller role.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAgentRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post('/agents/register', agentForm);
      setSuccess('Agent application submitted successfully! Your application is under review by the administrator.');
      await checkAuth();
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409) {
        setError('You have already applied or are already an agent.');
      } else {
        setError(err.response?.data?.detail || 'Failed to submit agent application.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Become a Partner</h1>
      <p className="text-gray-600 mb-8">Join the ScruPeak Digital Property ecosystem as a Seller or Real Estate Agent.</p>

      {error && <Alert variant="destructive" className="mb-6">{error}</Alert>}
      {success && <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">{success}</Alert>}

      <Tabs defaultValue="seller" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="seller">Become a Seller (Owner)</TabsTrigger>
          <TabsTrigger value="agent">Become an Agent</TabsTrigger>
        </TabsList>

        {/* SELLER TAB */}
        <TabsContent value="seller">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <UserCheck size={24} />
                </div>
                <div>
                  <CardTitle>Land Owner / Seller</CardTitle>
                  <CardDescription>For individuals who want to sell their own land.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      List your own properties directly
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      Manage inquiries and offers
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      Secure transactions via escrow
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={16} className="mt-0.5 text-blue-500" />
                      Identity Verification (KYC)
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText size={16} className="mt-0.5 text-blue-500" />
                      Proof of Land Ownership (Per Listing)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  Status Check:
                  {user.kyc_verified ? (
                    <Badge className="bg-green-500">KYC Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">KYC Required</Badge>
                  )}
                </h4>
                {!user.kyc_verified && (
                  <p className="text-sm text-gray-500 mb-4">
                    You need to complete identity verification before you can upgrade to a seller account.
                  </p>
                )}
                {user.role === 'owner' && (
                  <p className="text-sm text-blue-600 font-medium">
                    You are already a registered Seller/Owner.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {user.role === 'owner' ? (
                <Button onClick={() => navigate('/sell')} className="w-full">
                  Go to Seller Dashboard
                </Button>
              ) : !user.kyc_verified ? (
                <Button onClick={() => navigate('/kyc')} className="w-full">
                  Complete KYC Verification
                </Button>
              ) : (
                <Button onClick={handleSellerUpgrade} disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Upgrade to Seller Account'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>

        {/* AGENT TAB */}
        <TabsContent value="agent">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <Briefcase size={24} />
                </div>
                <div>
                  <CardTitle>Real Estate Agent</CardTitle>
                  <CardDescription>For professionals who manage listings for others.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      Manage multiple client portfolios
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      Professional profile & ratings
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-green-500" />
                      Official ministry recognition
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={16} className="mt-0.5 text-blue-500" />
                      Identity Verification (KYC)
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText size={16} className="mt-0.5 text-blue-500" />
                      Ministry Registration Number
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={16} className="mt-0.5 text-purple-500" />
                      Admin Approval
                    </li>
                  </ul>
                </div>
              </div>

              {user.role === 'agent' ? (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <h3 className="text-green-800 font-semibold mb-2">You are a Registered Agent</h3>
                    <p className="text-green-700 text-sm mb-4">Access your professional dashboard to manage listings.</p>
                    <Button onClick={() => navigate('/sell')} variant="outline" className="bg-white border-green-300 text-green-700 hover:bg-green-50">
                      Go to Agent Dashboard
                    </Button>
                 </div>
              ) : user.has_pending_agent_application ? (
                 <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                       <Briefcase className="text-yellow-600 w-6 h-6" />
                    </div>
                    <h3 className="text-yellow-800 font-semibold mb-2">Application Under Review</h3>
                    <p className="text-yellow-700 text-sm mb-4">
                      Your agent application has been submitted and is currently being reviewed by our administrators.
                      This process typically takes 24-48 hours.
                    </p>
                    <Button variant="outline" className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-100 cursor-default">
                      Check Back Later
                    </Button>
                 </div>
              ) : (
                <form onSubmit={handleAgentRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ministry Registration Number (Optional)</label>
                    <Input 
                      placeholder="e.g. REG-2024-XXXX" 
                      value={agentForm.ministry_registration_number}
                      onChange={(e) => setAgentForm({...agentForm, ministry_registration_number: e.target.value})}
                    />
                    <p className="text-xs text-gray-500">
                      If you are registered with the Ministry of Lands, provide your ID here for faster verification.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wallet Address (Optional)</label>
                    <Input 
                      placeholder="0x..." 
                      value={agentForm.wallet_address}
                      onChange={(e) => setAgentForm({...agentForm, wallet_address: e.target.value})}
                    />
                  </div>

                   <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 text-sm mb-1">Verification Required</h4>
                    <p className="text-xs text-yellow-700">
                      Agent applications require manual review by administrators. You will be notified once approved.
                      {!user.kyc_verified && " You must also complete KYC verification."}
                    </p>
                  </div>

                  {!user.kyc_verified ? (
                     <Button type="button" onClick={() => navigate('/kyc')} className="w-full">
                        Complete KYC Verification First
                     </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Submitting Application...' : 'Submit Agent Application'}
                    </Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleApplicationPage;
