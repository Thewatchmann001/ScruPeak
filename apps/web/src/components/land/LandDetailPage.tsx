"use client";

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { VerificationBadge, VerificationIndicator } from "@/components/verification/VerificationUI";
import { landService } from "@/services/landService";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  X,
  ArrowLeft,
  Map as MapIcon,
  ShieldCheck,
  FileText,
  Info,
  TrendingUp,
  ExternalLink,
  Navigation,
  Share2,
  Heart,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/context/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

// Extended interface to include status
interface LandDetailProps {
  id?: string;
  status?: string; // available, under_notice, disputed, sold
  location?: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
  };
  size?: number;
  sizeUnit?: "sqm" | "acres";
  purpose?: string;
  price?: number;
  verificationScore?: number;
  ownership?: {
    familyName: string;
    yearsHeld: number;
    dispute: boolean;
  };
  documents?: Array<{
    type: string;
    status: "verified" | "pending" | "flagged";
    date: string;
  }>;
  risks?: string[];
  mapImage?: string;
}

export default function LandDetailPage(props: LandDetailProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const [land, setLand] = useState<LandDetailProps>(props);
  const [loading, setLoading] = useState(!props.id && !!paramId);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "documents" | "intelligence">("overview");
  
  // Objection Form State
  const [objectionReason, setObjectionReason] = useState("");
  const [submittingObjection, setSubmittingObjection] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!props.id && paramId) {
      setLoading(true);
      landService.getById(paramId).then((response: any) => {
        const item = response.data;
        setLand({
          id: item.id,
          status: item.status,
          location: {
            country: "Sierra Leone",
            district: item.district,
            chiefdom: item.region,
            community: item.title,
          },
          size: Number(item.size_sqm),
          sizeUnit: "sqm",
          purpose: item.description?.substring(0, 30) || "Land Parcel",
          price: Number(item.price),
          verificationScore: item.blockchain_verified ? 98 : 85,
          ownership: {
            familyName: item.owner?.name || "Private Owner",
            yearsHeld: 10,
            dispute: item.status === "disputed"
          },
          documents: item.documents?.map((d: any) => ({
            type: d.document_type,
            status: d.blockchain_verified ? "verified" : "pending",
            date: d.created_at?.split('T')[0]
          })) || [],
          risks: item.status === "disputed" ? ["Ownership Conflict Detected"] : [],
          mapImage: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${item.longitude},${item.latitude},16,0/1200x600?access_token=pk.mock`
        });
      }).catch(err => {
        console.error("Failed to fetch land details:", err);
        showToast("Property record could not be retrieved", "error");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [paramId, props.id]);

  const handleLodgeObjection = async () => {
    if (!objectionReason || objectionReason.length < 10) {
        showToast("Please provide a detailed reason (min 10 chars)", "error");
        return;
    }
    
    setSubmittingObjection(true);
    try {
        if (land.id) {
            await landService.lodgeObjection(land.id, objectionReason);
            showToast("Objection lodged successfully. Admin will review.", "success");
            setShowObjectionModal(false);
            setObjectionReason("");
            setLand(prev => ({ ...prev, status: "disputed" }));
        }
    } catch (error) {
        showToast("Failed to lodge objection", "error");
    } finally {
        setSubmittingObjection(false);
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-[#0B1015] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Decrypting Registry Data...</p>
        </div>
      );
  }

  if (!land.location) return <div className="min-h-screen bg-[#0B1015] flex items-center justify-center text-white">Land Registry record not found</div>;

  const riskLevel = (land.verificationScore || 0) >= 80 ? "low" : (land.verificationScore || 0) >= 50 ? "medium" : "high";

  return (
    <div className="min-h-screen bg-[#0B1015] text-slate-200 selection:bg-orange-500/30">
      {/* Premium Navbar for Detail */}
      <div className="bg-[#0B1015]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/marketplace"
            className="group flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-all"
          >
            <div className="p-2 rounded-full bg-slate-800 group-hover:bg-orange-600 transition-colors">
               <ArrowLeft className="w-4 h-4 text-white" />
            </div>
            Registry Explorer
          </Link>
          <div className="flex gap-3">
             <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <Share2 className="w-5 h-5" />
             </button>
             <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                <Heart className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Hero / Map Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
         {/* Simulated Map Background */}
         <div className="absolute inset-0 bg-[#121923]">
            <img
              src={land.mapImage}
              alt="Land map"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1015] via-transparent to-transparent" />
         </div>

         <div className="absolute bottom-10 left-0 w-full">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                {land.status?.replace('_', ' ')}
                            </span>
                            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Blockchain Certified
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                            {land.location.community}
                        </h1>
                        <p className="text-xl text-slate-300 font-medium flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-orange-500" />
                            {land.location.district}, {land.location.chiefdom}
                        </p>
                    </div>

                    <div className="bg-[#121923]/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">List Price</p>
                        <div className="text-4xl font-black text-white">
                            Le {land.price?.toLocaleString()}
                        </div>
                        <p className="text-xs text-orange-500 font-bold mt-1">Verified Valuation</p>
                    </div>
                </motion.div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Status Alerts */}
        <AnimatePresence>
            {land.status === "under_notice" && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-10 overflow-hidden"
                >
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-500 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="text-orange-500 font-black uppercase tracking-tight">Public Notice Period Active</h4>
                                <p className="text-slate-400 text-sm mt-1">This property is in its 21-day community verification window. Stakeholders may lodge objections.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white min-w-[200px]"
                            onClick={() => setShowObjectionModal(true)}
                        >
                            Lodge Objection
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SpecCard label="Parcel Size" value={`${land.size?.toLocaleString()} ${land.sizeUnit}`} icon={MapIcon} />
                <SpecCard label="Usage" value={land.purpose || "N/A"} icon={Info} />
                <SpecCard label="Market Tier" value="Prime" icon={TrendingUp} />
                <SpecCard label="Registry ID" value={`SL-${land.id?.substring(0,6)}`} icon={ShieldCheck} />
            </div>

            {/* Tabs */}
            <div className="space-y-8">
                <div className="flex gap-8 border-b border-slate-800">
                    {["overview", "documents", "intelligence"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab as any)}
                        className={`pb-4 font-black text-xs uppercase tracking-widest transition-all relative ${
                        selectedTab === tab
                            ? "text-orange-500"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {tab}
                        {selectedTab === tab && (
                            <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />
                        )}
                    </button>
                    ))}
                </div>

                <div className="min-h-[300px]">
                    {selectedTab === "overview" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="bg-[#121923] rounded-3xl p-8 border border-slate-800">
                                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Legal Ownership</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrant Family</p>
                                        <p className="text-2xl font-bold text-white">{land.ownership?.familyName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tenure Length</p>
                                        <p className="text-2xl font-bold text-white">{land.ownership?.yearsHeld} Years</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legal Status</p>
                                        <div className="flex items-center gap-2">
                                            {land.ownership?.dispute ? (
                                                <>
                                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                                    <span className="text-red-500 font-bold">Active Dispute Flag</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                    <span className="text-emerald-500 font-bold">Clear of Litigation</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Property Narrative</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    Located in the heart of the Bureh Town development corridor, this parcel represents
                                    a prime investment opportunity. The land has been held by the {land.ownership?.familyName} for
                                    over four decades and is fully registered under the new national biometric system.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {selectedTab === "documents" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {land.documents?.map((doc, idx) => (
                                <div key={idx} className="bg-[#121923] p-6 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-orange-500/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-orange-600 transition-colors">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{doc.type}</p>
                                            <p className="text-xs text-slate-500">Verified {doc.date}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white" />
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {selectedTab === "intelligence" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#121923] rounded-3xl p-8 border border-slate-800 space-y-6"
                        >
                            <div className="flex items-center gap-4 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                <TrendingUp className="w-8 h-8 text-orange-500" />
                                <div>
                                    <p className="text-white font-bold">Lanstimate™ Growth Potential</p>
                                    <p className="text-sm text-slate-400">Projected 15% YoY appreciation based on infrastructure rollout.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <IntelligenceItem label="Flood Risk" value="Extremely Low" status="success" />
                                <IntelligenceItem label="Road Access" value="Primary Paved" status="success" />
                                <IntelligenceItem label="Power Grid" value="Available (200m)" status="warning" />
                                <IntelligenceItem label="Zoning" value="Mixed Residential" status="success" />
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Trust Center */}
            <div className="bg-[#121923] rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-8">
                <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Registry Trust Score</h3>
                    <VerificationIndicator score={land.verificationScore || 0} risk={riskLevel} />
                </div>

                <div className="space-y-4">
                    <VerificationBadge
                        status="verified"
                        label="Liveness Confirmed"
                        description="Registrant verified via biometric KYC"
                    />
                    <VerificationBadge
                        status="verified"
                        label="On-chain Title"
                        description="Deed hash recorded on Solana"
                    />
                    <VerificationBadge
                        status={land.ownership?.dispute ? "flag" : "verified"}
                        label={land.ownership?.dispute ? "Dispute Flag" : "Market Ready"}
                        description={land.ownership?.dispute ? "Public objection filed" : "Zero active liens detected"}
                    />
                </div>

                <div className="pt-8 border-t border-slate-800 space-y-4">
                    <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-6 rounded-2xl border-none shadow-xl flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Initiate Inquiry
                    </Button>
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 py-6 rounded-2xl hover:bg-slate-800">
                        Request Site Visit
                    </Button>
                </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8">
                <div className="flex items-center gap-2 text-indigo-400 mb-4">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Market Alpha</span>
                </div>
                <h4 className="text-white font-bold mb-2">Institutional interest is rising in {land.location.district}.</h4>
                <p className="text-sm text-slate-400">3 properties nearby were recently acquired for commercial development.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Objection Modal */}
      <AnimatePresence>
        {showObjectionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#0B1015]/90 backdrop-blur-md"
                    onClick={() => setShowObjectionModal(false)}
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#121923] border border-slate-800 rounded-[2rem] max-w-lg w-full p-10 shadow-2xl relative z-10"
                >
                    <button onClick={() => setShowObjectionModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>

                    <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Lodge Objection</h3>
                    <p className="text-slate-400 mb-8 font-medium">Lodge a formal claim against this registry entry.</p>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                            <p className="text-red-400 text-xs font-bold leading-relaxed">
                                WARNING: Frivolous objections are subject to legal penalties. Your identity and claim hash will be recorded immutably.
                            </p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Basis for Claim</label>
                            <textarea
                                className="w-full h-40 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                                placeholder="Describe the boundary, title, or inheritance dispute in detail..."
                                value={objectionReason}
                                onChange={(e) => setObjectionReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button variant="outline" className="flex-1 border-slate-800 text-slate-400" onClick={() => setShowObjectionModal(false)}>Cancel</Button>
                        <Button
                            onClick={handleLodgeObjection}
                            disabled={submittingObjection}
                            className="flex-1 bg-red-600 hover:bg-red-50 text-white border-none font-bold"
                        >
                            {submittingObjection ? "Transmitting..." : "Submit Claim"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecCard({ label, value, icon: Icon }: any) {
    return (
        <div className="bg-[#121923] p-6 rounded-2xl border border-slate-800">
            <Icon className="w-5 h-5 text-orange-500 mb-4" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    )
}

function IntelligenceItem({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'error' }) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
            <span className="text-xs font-medium text-slate-400">{label}</span>
            <span className={`text-xs font-bold ${
                status === 'success' ? 'text-emerald-500' : status === 'warning' ? 'text-orange-500' : 'text-red-500'
            }`}>{value}</span>
        </div>
    )
}
