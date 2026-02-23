"use client";

import { Link } from "react-router-dom";
import { VerificationIndicator } from "@/components/verification/VerificationUI";
import { MapPin, LayoutDashboard, ShieldCheck } from "lucide-react";

interface ZillowCardProps {
  id: string;
  image: string;
  price: number;
  location: {
    community: string;
    chiefdom: string;
    district: string;
  };
  size: number;
  sizeUnit: "sqm" | "acres";
  purpose: string;
  verificationScore: number;
  daysOnMarket?: number;
  isSaved?: boolean;
  onSelect?: () => void;
}

export function ZillowCard({
  id,
  image,
  price,
  location,
  size,
  sizeUnit,
  purpose,
  verificationScore,
  daysOnMarket = 5,
  isSaved = false,
}: ZillowCardProps) {
  const riskLevel = verificationScore >= 80 ? "low" : verificationScore >= 50 ? "medium" : "high";

  return (
    <Link to={`/land/${id}`}>
      <div className="group bg-[#121923] rounded-[2.5rem] overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-500 shadow-2xl relative">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-slate-900">
          <img
            src={image}
            alt={`${location.community}, ${location.district}`}
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121923] via-transparent to-transparent" />

          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-xl font-black text-lg shadow-xl shadow-orange-600/20 z-10">
            Le {(price / 1000).toFixed(0)}K
          </div>

          {/* Verification indicator */}
          <div className="absolute top-4 left-4 z-10">
             <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${verificationScore > 90 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{verificationScore}% Trust</span>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Location */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">
               <MapPin size={12} /> {location.district} • {location.chiefdom}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1 uppercase tracking-tight">
              {location.community}
            </h3>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Parcel Size</p>
              <p className="font-bold text-white text-sm">
                {size.toLocaleString()} <span className="text-slate-500">{sizeUnit}</span>
              </p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Usage</p>
              <p className="font-bold text-white text-sm">{purpose}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                   <ShieldCheck size={14} className="text-blue-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certified Record</span>
             </div>

             <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {daysOnMarket}D Active
             </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
