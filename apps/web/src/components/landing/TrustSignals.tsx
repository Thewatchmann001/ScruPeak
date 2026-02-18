import React from "react";
import { Shield, Lock, Globe, CheckCircle } from "lucide-react";

export default function TrustSignals() {
  return (
    <section className="py-12 bg-slate-950 border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
            <Shield className="w-5 h-5 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Blockchain Secured</p>
              <p className="text-[9px] opacity-60">Immutable Title Logs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
            <Lock className="w-5 h-5 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">KYC / AML Vetted</p>
              <p className="text-[9px] opacity-60">Compliant Transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
            <Globe className="w-5 h-5 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">National Standards</p>
              <p className="text-[9px] opacity-60">Ministry Alignment</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
            <CheckCircle className="w-5 h-5 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">99.9% Integrity</p>
              <p className="text-[9px] opacity-60">Conflict-Free Data</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
