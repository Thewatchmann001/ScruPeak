"use client";

import { Land } from "@/types";
import { ShieldCheck, MapPin, Eye, MessageSquare, ExternalLink, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { useNavigate } from "react-router-dom";

interface LandCardProps {
  land: Land;
  onSelect?: (id: string) => void;
}

export function LandCard({ land, onSelect }: LandCardProps) {
  const navigate = useNavigate();

  const verificationScore = land.blockchain_hash ? 100 : 
    (land.documents?.some(d => d.verified_at) ? 85 : 45);
  
  const imageUrl = land.documents?.find(d => d.document_type === 'property_image')?.file_url ||
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop';

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={() => onSelect ? onSelect(land.id) : navigate(`/land/${land.id}`)}
      className="group bg-[#1e293b] border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 cursor-pointer flex flex-col h-full"
    >
      {/* Visual Header */}
      <div className="h-56 overflow-hidden relative group-hover:after:opacity-40 after:absolute after:inset-0 after:bg-black after:opacity-20 after:transition-opacity after:duration-500">
        <img
          src={imageUrl}
          alt={land.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop';
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <StatusBadge status={land.status} />
          {land.blockchain_hash && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ring-2 ring-blue-600/20">
               <Zap size={10} fill="currentColor" /> Blockchain Anchored
            </div>
          )}
        </div>

        {/* Parcel ID Overlay */}
        <div className="absolute bottom-4 left-4 z-10">
           <span className="text-[10px] font-mono bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-orange-400 font-bold border border-white/10 tracking-widest uppercase">
              {land.parcel_id || 'ID Pending'}
           </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Content */}
        <div className="mb-6 flex-1">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
            <MapPin size={12} className="text-orange-500" /> {land.district}, {land.region}
          </div>

          <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
            {land.title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
             <span className="bg-slate-800/50 px-2.5 py-1 rounded-lg">{(land.size_sqm / 4046.86).toFixed(2)} Acres</span>
             <span className="bg-slate-800/50 px-2.5 py-1 rounded-lg">{land.size_sqm.toLocaleString()} sqm</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Market Price</div>
          <div className="text-2xl font-black text-white">
            Le {land.price?.toLocaleString()}
          </div>
        </div>

        {/* Stats & Trust */}
        <div className="pt-6 border-t border-slate-800/50 mt-auto flex items-center justify-between">
           <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                 <Eye size={14} /> <span className="text-xs font-bold">124</span>
              </div>
              <div className="flex items-center gap-1">
                 <MessageSquare size={14} /> <span className="text-xs font-bold">8</span>
              </div>
           </div>

           <div className="flex flex-col items-end">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Integrity Score</div>
              <div className="flex items-center gap-2">
                 <span className={`text-xs font-black ${verificationScore >= 80 ? 'text-green-500' : 'text-orange-500'}`}>{verificationScore}%</span>
                 <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${verificationScore >= 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'}`}
                      style={{ width: `${verificationScore}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    sold: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const label = status.toUpperCase();
  const className = styles[status] || "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-[0.15em] border backdrop-blur-md shadow-lg ${className}`}>
      {label}
    </span>
  );
}
