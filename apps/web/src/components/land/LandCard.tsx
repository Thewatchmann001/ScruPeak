"use client";

import { Land } from "@/types";
import { Shield, MapPin, Maximize, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface LandCardProps {
  land: Land;
  onSelect?: (id: string) => void;
}

export function LandCard({ land, onSelect }: LandCardProps) {
  // Derived values or fallbacks
  const verificationScore = land.blockchain_hash ? 100 : 
    (land.documents?.some(d => d.verified_at) ? 80 : 40);
  
  const imageUrl = land.documents?.find(d => d.document_type === 'image')?.file_url || 
    '/placeholder-land.jpg';

  const isVerified = verificationScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect?.(land.id)}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative h-56 bg-slate-50 overflow-hidden">
        <img
          src={imageUrl}
          alt={land.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Verification Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border ${
            isVerified
              ? 'bg-emerald-500/90 border-emerald-400/50 text-white'
              : 'bg-amber-500/90 border-amber-400/50 text-white'
          } shadow-lg shadow-black/10`}>
            <Shield className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isVerified ? 'Verified' : 'Pending'} {verificationScore}%
            </span>
          </div>
        </div>

        {/* Price Tag Overlay (on hover) */}
        <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <div className="bg-primary text-white p-2 rounded-xl shadow-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1 text-primary font-black text-lg">
            <span className="text-sm font-bold mt-1">Le</span>
            {land.price ? land.price.toLocaleString() : 'P.O.R'}
          </div>
          {land.status === 'available' && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        <h3 className="text-slate-900 font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {land.title}
        </h3>

        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{land.district}, {land.region}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5" />
            <span>{land.size_sqm.toLocaleString()} sqm</span>
          </div>
          <div className="px-2 py-1 bg-slate-50 rounded-md text-slate-500 uppercase tracking-tighter text-[9px]">
            {land.classification?.name || 'Standard'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
