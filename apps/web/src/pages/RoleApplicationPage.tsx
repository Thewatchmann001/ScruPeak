import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Briefcase, FileText, CheckCircle2, ArrowRight, Star, Globe, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RoleApplicationPage = () => {
  const { user, isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'seller' | 'agent' | null>(null);

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
      await api.post('/users/upgrade/seller', {});
      setSuccess('Welcome to the seller community! You can now list your properties.');
      await checkAuth();
      setTimeout(() => navigate('/sell'), 2000);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('KYC')) {
        setError('Identity verification is mandatory for sellers. Please complete KYC first.');
      } else {
        setError(err.response?.data?.detail || 'Failed to upgrade. Please try again.');
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
      setSuccess('Professional application submitted. Our team will review your credentials.');
      await checkAuth();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit agent application.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20 pt-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 mb-4 px-4 py-1">Partnership Program</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Choose Your <span className="text-orange-500 text-glow-orange">Path</span></h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Join the national digital land transformation. Whether you're an individual owner or a professional agent, we have the tools you need to succeed.</p>
        </motion.header>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl p-4">
              {error}
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <Alert className="bg-green-500/10 border-green-500/20 text-green-400 rounded-2xl p-4">
               <CheckCircle2 className="h-5 w-5 mr-2 inline" /> {success}
            </Alert>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 mb-12"
        >
          {/* SELLER CARD */}
          <motion.div variants={itemVariants}>
            <div
              onClick={() => setSelectedRole('seller')}
              className={`group relative h-full cursor-pointer rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
                selectedRole === 'seller' ? 'border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10' : 'border-slate-800 bg-[#1e293b]/50 hover:border-slate-700'
              }`}
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                    selectedRole === 'seller' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <UserCheck size={32} />
                  </div>
                  {user.role === 'owner' && <Badge className="bg-green-500/20 text-green-500 border-none">Active</Badge>}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Individual Owner</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">Perfect for individuals who want to list and sell their own land parcels directly to verified buyers.</p>

                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Zap, text: 'Instant listing tools' },
                    { icon: ShieldCheck, text: 'Verified title protection' },
                    { icon: Globe, text: 'National marketplace reach' }
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-orange-500">
                        <feat.icon size={12} />
                      </div>
                      {feat.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`absolute bottom-0 inset-x-0 h-1.5 transition-all duration-500 ${selectedRole === 'seller' ? 'bg-orange-500' : 'bg-transparent'}`} />
            </div>
          </motion.div>

          {/* AGENT CARD */}
          <motion.div variants={itemVariants}>
            <div
              onClick={() => setSelectedRole('agent')}
              className={`group relative h-full cursor-pointer rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
                selectedRole === 'agent' ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : 'border-slate-800 bg-[#1e293b]/50 hover:border-slate-700'
              }`}
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                    selectedRole === 'agent' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Briefcase size={32} />
                  </div>
                  {user.role === 'agent' && <Badge className="bg-green-500/20 text-green-500 border-none">Active</Badge>}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Real Estate Agent</h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-sm">For professionals managing large portfolios. Requires ministry registration and provides advanced analytics.</p>

                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Star, text: 'Professional rating system' },
                    { icon: Zap, text: 'Bulk parcel management' },
                    { icon: Globe, text: 'Authorized broker status' }
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-blue-500">
                        <feat.icon size={12} />
                      </div>
                      {feat.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`absolute bottom-0 inset-x-0 h-1.5 transition-all duration-500 ${selectedRole === 'agent' ? 'bg-blue-500' : 'bg-transparent'}`} />
            </div>
          </motion.div>
        </motion.div>

        {/* DYNAMIC FORM SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
           {selectedRole === 'seller' && (
             <div className="bg-[#1e293b] rounded-3xl border border-slate-800 p-8 md:p-12 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <UserCheck size={200} className="text-orange-500" />
                </div>
                <div className="max-w-2xl">
                  <h3 className="text-3xl font-bold text-white mb-4">Start Selling as Owner</h3>
                  <p className="text-slate-400 mb-8">Individual ownership grants you immediate access to listing tools once your identity is verified. No registration fees required.</p>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {!user.kyc_verified ? (
                      <Button onClick={() => navigate('/kyc')} size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        Complete KYC Verification <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    ) : user.role === 'owner' ? (
                      <Button onClick={() => navigate('/sell')} size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold">
                        Go to Dashboard
                      </Button>
                    ) : (
                      <Button onClick={handleSellerUpgrade} disabled={loading} size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing</> : 'Activate Seller Account'}
                      </Button>
                    )}
                  </div>
                </div>
             </div>
           )}

           {selectedRole === 'agent' && (
             <div className="bg-[#1e293b] rounded-3xl border border-slate-800 p-8 md:p-12 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Briefcase size={200} className="text-blue-500" />
                </div>
                <div className="max-w-2xl">
                  <h3 className="text-3xl font-bold text-white mb-4">Apply for Professional Status</h3>
                  <p className="text-slate-400 mb-8">Join our network of authorized real estate professionals. Agent accounts undergo a vetting process to ensure marketplace integrity.</p>

                  {user.role === 'agent' ? (
                    <Button onClick={() => navigate('/sell')} size="lg" className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                      Go to Agent Dashboard
                    </Button>
                  ) : user.has_pending_agent_application ? (
                    <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3 text-blue-400 font-bold mb-2">
                        <Loader2 className="animate-spin h-5 w-5" /> Application Under Review
                      </div>
                      <p className="text-slate-400 text-sm">We're verifying your ministry credentials. This normally takes 2-3 business days.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleAgentRegistration} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ministry License Number</label>
                          <Input
                            className="bg-slate-900/50 border-slate-800 h-12 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="e.g. REG-2024-XXXX"
                            value={agentForm.ministry_registration_number}
                            onChange={(e) => setAgentForm({...agentForm, ministry_registration_number: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Blockchain Wallet (Optional)</label>
                          <Input
                            className="bg-slate-900/50 border-slate-800 h-12 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="0x... or Solana Address"
                            value={agentForm.wallet_address}
                            onChange={(e) => setAgentForm({...agentForm, wallet_address: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-center pt-4">
                        {!user.kyc_verified ? (
                          <Button type="button" onClick={() => navigate('/kyc')} size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            Complete KYC First
                          </Button>
                        ) : (
                          <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Submitting</> : 'Submit Professional Application'}
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
             </div>
           )}

           {!selectedRole && (
             <div className="text-center py-12 bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-800">
               <p className="text-slate-500 font-medium">Select a role above to view requirements and benefits</p>
             </div>
           )}
        </motion.div>
      </div>
    </div>
  );
};

export default RoleApplicationPage;
