"use client";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";

export function PremiumCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="bg-[#0B1015] py-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Card - Register */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-[#121923] p-12 md:p-16 text-white min-h-[450px] flex flex-col justify-center border border-slate-800 shadow-2xl group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 mb-8 border border-orange-500/20">
               <ShieldCheck size={24} />
            </div>
            <h3 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter">Secure Your <span className="text-orange-500">Legacy</span></h3>
            
            <p className="text-slate-400 text-lg mb-10 max-w-md font-medium leading-relaxed">
              Transform your paper deeds into immutable digital assets. Protected by the national grid and blockchain security.
            </p>
            
            <button
              onClick={() =>
                user ? navigate("/kyc") : navigate("/auth/login?redirect=/kyc")
              }
              className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg rounded-2xl transition-all transform hover:scale-105 shadow-xl shadow-orange-600/20 flex items-center gap-3 uppercase tracking-widest"
            >
              Get Registered <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* Right Card - Invest */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-[#121923] p-12 md:p-16 text-white min-h-[450px] flex flex-col justify-center border border-slate-800 shadow-2xl group"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" 
              alt="Luxury Home" 
              className="w-full h-full object-cover opacity-20 grayscale group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121923] via-transparent to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20">
               <TrendingUp size={24} />
            </div>
            <h3 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter">Market <span className="text-blue-400">Alpha</span></h3>
            
            <p className="text-slate-400 text-lg mb-10 max-w-md font-medium leading-relaxed">
              Explore verified investment opportunities with institutional-grade risk assessment and Lanstimate™ valuations.
            </p>
            
            <button
              onClick={() => navigate("/marketplace")}
              className="px-10 py-4 bg-white hover:bg-slate-100 text-[#0B1015] font-black text-lg rounded-2xl transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 uppercase tracking-widest"
            >
              Browse Registry <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
