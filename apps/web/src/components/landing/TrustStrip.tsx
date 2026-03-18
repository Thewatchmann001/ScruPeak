import React from "react";
import { ShieldCheck, Target, Database, Lock } from "lucide-react";

export function TrustStrip() {
  const trusts = [
    { icon: ShieldCheck, number: "2,400+", label: "Verified Listings" },
    { icon: Target, number: "100%", label: "Survey Confirmed" },
    { icon: Database, number: "On-Chain", label: "Records" },
    { icon: Lock, number: "Escrow", label: "Protected" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 -mt-16 mb-16 relative z-20">
      <div className="bg-white rounded-xl border border-border shadow-md py-8 px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {trusts.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="text-xl font-bold text-text mb-0.5">{item.number}</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-text-muted">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
