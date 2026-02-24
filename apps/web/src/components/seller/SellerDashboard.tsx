import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Search, Filter, MoreHorizontal, Eye, MessageSquare,
  ShieldCheck, LayoutDashboard, MapPin, Landmark, UserCheck,
  ArrowRight, Activity, TrendingUp, AlertCircle, FileText,
  ChevronRight, Wallet, Clock, CheckCircle2, ShieldAlert,
  Loader2, Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { CreateListingModal } from "./CreateListingModal";
import { Land } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth/login');
  }, [isAuthenticated, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/land/my-listings');
      setListings(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchListings();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const steps = [
    { id: 'kyc', title: 'Verify Identity', status: user?.kyc_verified ? 'done' : 'pending', link: '/kyc', icon: UserCheck },
    { id: 'role', title: 'Apply for Role', status: (user?.role === 'owner' || user?.role === 'agent') ? 'done' : 'pending', link: '/apply-role', icon: Landmark },
    { id: 'list', title: 'List Property', status: listings.length > 0 ? 'done' : 'pending', link: '#', action: () => setIsCreateModalOpen(true), icon: MapPin },
  ];

  const handleCreateListing = () => {
    if (!user?.kyc_verified) {
      navigate('/kyc');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleListingCreated = () => {
    setIsCreateModalOpen(false);
    fetchListings();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* DASHBOARD HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em] mb-2">
               <Activity size={14} /> Live System Status
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Mission <span className="text-orange-500">Control</span></h1>
            <p className="text-slate-400 mt-1">Manage your national land registry assets and verification pipeline.</p>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 rounded-xl px-6">
                Market Insights
             </Button>
             <Button
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
                onClick={handleCreateListing}
              >
                <Plus className="w-5 h-5 mr-2" />
                Register New Land
              </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: GUIDED ONBOARDING & STATS */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* ONBOARDING FLOW */}
            <section className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="text-xl font-bold text-white mb-6">Onboarding Progress</h3>
               <div className="space-y-6 relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-800" />

                  {steps.map((step, idx) => (
                    <div
                      key={step.id}
                      onClick={() => step.status !== 'done' && (step.action ? step.action() : navigate(step.link))}
                      className={`relative flex items-center gap-4 group transition-all cursor-pointer ${step.status === 'done' ? 'opacity-60 hover:opacity-100' : ''}`}
                    >
                      <div className={`z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        step.status === 'done' ? 'bg-green-500/20 text-green-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 group-hover:scale-110'
                      }`}>
                        {step.status === 'done' ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${step.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {step.title}
                        </p>
                        {step.status !== 'done' && (
                          <p className="text-[10px] text-orange-500 uppercase tracking-widest font-black">Action Required</p>
                        )}
                      </div>
                      {step.status !== 'done' && <ChevronRight size={16} className="text-slate-600 group-hover:text-orange-500 transition-colors" />}
                    </div>
                  ))}
               </div>
            </section>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#1e293b]/50 border border-slate-800 rounded-3xl p-6">
                  <Eye className="text-orange-500 mb-2" size={20} />
                  <p className="text-2xl font-black text-white">{(listings.length * 124).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Views</p>
               </div>
               <div className="bg-[#1e293b]/50 border border-slate-800 rounded-3xl p-6">
                  <MessageSquare className="text-orange-500 mb-2" size={20} />
                  <p className="text-2xl font-black text-white">{(listings.length * 8).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Inquiries</p>
               </div>
            </div>

            {/* BLOCKCHAIN STATUS */}
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-[2rem] p-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                     <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Registry Network</h4>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Solana Mainnet-Beta</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Tokens</span>
                    <span className="text-white font-bold">{listings.filter(l => l.blockchain_hash).length} Assets</span>
                  </div>
                  <div className="w-full h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(listings.filter(l => l.blockchain_hash).length / (listings.length || 1)) * 100}%` }} />
                  </div>
               </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LISTINGS MANAGEMENT */}
          <div className="lg:col-span-2 space-y-8">

            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search by Parcel ID or Location..."
                    className="w-full bg-[#1e293b] border border-slate-800 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  />
               </div>
               <Button variant="outline" className="h-14 px-6 border-slate-800 bg-slate-900/50 rounded-2xl">
                  <Filter className="w-5 h-5 mr-2" /> Filters
               </Button>
            </div>

            {/* LISTINGS GRID */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold text-white">Your Land Assets</h3>
                  <Badge className="bg-slate-800 text-slate-400 border-none">{listings.length} Properties</Badge>
               </div>

               <AnimatePresence mode="popLayout">
                 {loading ? (
                    <div className="py-20 text-center">
                       <Loader2 className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" />
                       <p className="text-slate-500 animate-pulse">Syncing with registry...</p>
                    </div>
                 ) : listings.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1e293b]/30 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 text-center px-8">
                       <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-600">
                          <MapPin size={40} />
                       </div>
                       <h4 className="text-xl font-bold text-white mb-2">No active listings</h4>
                       <p className="text-slate-500 max-w-sm mx-auto mb-8">Ready to join the digital registry? Start by creating your first property listing.</p>
                       <Button onClick={handleCreateListing} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-10 h-12">
                          Start Listing Process
                       </Button>
                    </motion.div>
                 ) : (
                    <div className="grid gap-4">
                       {listings.map((listing) => (
                         <motion.div
                           key={listing.id}
                           layout
                           initial={{ opacity: 0, scale: 0.98 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="bg-[#1e293b] border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all group relative overflow-hidden"
                         >
                            {/* Decorative ID Background */}
                            <div className="absolute -top-4 -right-4 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity font-mono text-8xl font-black">
                               {listing.parcel_id?.split('-').pop()}
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                               {/* Map/Image Placeholder */}
                               <div className="w-full md:w-32 h-32 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-700 overflow-hidden relative">
                                  <MapIcon size={32} />
                                  <span className="text-[8px] uppercase tracking-tighter mt-2 font-black">Spatial Preview</span>
                                  {listing.status === 'available' && <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />}
                               </div>

                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[10px] font-mono text-orange-500/80 font-black tracking-widest">{listing.parcel_id}</span>
                                     <StatusBadge status={listing.status} />
                                  </div>
                                  <h4 className="text-xl font-bold text-white mb-1 group-hover:text-orange-500 transition-colors">{listing.title}</h4>
                                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-400 font-medium">
                                     <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-600" /> {listing.district}, {listing.region}</span>
                                     <span className="flex items-center gap-1.5"><LayoutDashboard size={14} className="text-slate-600" /> {(listing.size_sqm / 4046.86).toFixed(2)} Acres</span>
                                  </div>
                               </div>

                               <div className="flex md:flex-col justify-between items-end gap-2">
                                  <p className="text-2xl font-black text-white">Le {listing.price?.toLocaleString()}</p>
                                  <div className="flex gap-2">
                                     <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800">
                                        <Eye size={18} />
                                     </Button>
                                     <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800">
                                        <MoreHorizontal size={18} />
                                     </Button>
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleListingCreated}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    sold: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    disputed: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  
  const label = status.toUpperCase();
  const className = styles[status] || "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-[0.1em] border ${className}`}>
      {label}
    </span>
  );
}
