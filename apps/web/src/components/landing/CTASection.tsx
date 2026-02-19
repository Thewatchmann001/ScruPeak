import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-4xl mx-auto p-12 md:p-20 rounded-[4rem] bg-slate-900/50 border border-white/5 backdrop-blur-xl">
          <h2 className="text-3xl md:text-6xl font-black text-white mb-8 leading-[1.1] tracking-tighter">
            Secure Your Heritage <br />
            <span className="text-orange-500">Without Fear.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
            Join thousands of smart investors who use LandBiznes to discover, verify, and secure land assets at the highest global standards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => navigate('/marketplace')}
              className="w-full sm:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3 group"
            >
              Search Marketplace
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth/login?redirect=/kyc')}
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-slate-200"
            >
              <Calendar className="w-6 h-6 text-orange-600" />
              Register Land
            </button>
          </div>

          <p className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
            Dispute-Free Guarantee. Verified Titles. Secure Escrow.
          </p>
        </div>
      </div>
    </section>
  );
}
