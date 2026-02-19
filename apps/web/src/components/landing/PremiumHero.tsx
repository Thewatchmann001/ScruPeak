import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowDown, Shield, MapPin, Target, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { motion } from "framer-motion";

export default function PremiumHero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=2664"
          alt="Land Background" 
          className="w-full h-full object-cover opacity-40 grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
      </div>

      {/* Animated Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">
              The Gold Standard for Verified Land
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tighter">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Absolute</span>
            <br /> Certainty in Ownership
          </h1>

          {/* Subheading - Fixed spacing for AI-Powered */}
          <p className="text-lg lg:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Sierra Leone's leading land registry and marketplace.
            Verify titles instantly with <span className="text-white font-semibold">AI-Powered</span> intelligence.
          </p>

          {/* Zillow-style Search Bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter district, chiefdom, or village..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 text-slate-900 font-medium focus:outline-none placeholder:text-slate-400 text-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black px-10 py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 text-lg"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick Stats / Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-white/60">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-sm uppercase tracking-widest">100% Secure Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-sm uppercase tracking-widest">Digital Survey Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-sm uppercase tracking-widest">Government Aligned</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] text-white font-bold tracking-[0.3em] uppercase">Scroll to explore</span>
          <ArrowDown className="w-5 h-5 text-orange-500 animate-bounce" />
        </div>
      </motion.div>

      {/* Abstract Background Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}
