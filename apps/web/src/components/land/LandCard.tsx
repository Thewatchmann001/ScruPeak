"use client";

import { Land } from "@/types";

interface LandCardProps {
  land: Land;
  onSelect?: (id: string) => void;
}

import { ShieldCheck, MapPin, Maximize } from "lucide-react";

export function LandCard({ land, onSelect }: LandCardProps) {
  // Derived values or fallbacks
  const verificationScore = land.blockchain_verified ? 100 :
    (land.has_survey_plan ? 80 : 40);
  
  const imageUrl = land.documents?.find(d => d.document_type === 'image')?.file_url || 
    'https://placehold.co/600x400?text=Land+Image';

  return (
    <div
      onClick={() => onSelect?.(land.id)}
      className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-neutral-100">
        <img
          src={imageUrl}
          alt={land.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Land+Image';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg ${
            land.status === 'available' ? 'bg-emerald-500 text-white' :
            land.status === 'sold' ? 'bg-red-500 text-white' :
            'bg-amber-500 text-white'
          }`}>
            {land.status}
          </span>
        </div>

        {/* Verification Overlay */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-white">
          <ShieldCheck className={`w-3.5 h-3.5 ${verificationScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="text-[10px] font-black text-neutral-800">{verificationScore}%</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Price Tag Overlay */}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-2xl font-black tracking-tight">
            ${land.price?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-1 text-neutral-500 mb-1">
            <MapPin className="w-3 h-3" />
            <p className="text-[10px] font-bold uppercase tracking-wider truncate">
               {land.district} • {land.region}
            </p>
          </div>
          <h3 className="text-base font-black text-neutral-900 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
            {land.title}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-y border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <Maximize className="w-3 h-3 text-orange-600" />
            </div>
            <div>
              <p className="text-[9px] text-neutral-400 font-bold uppercase leading-none mb-1">Size</p>
              <p className="text-xs font-black text-neutral-800 leading-none">
                {land.size_sqm.toLocaleString()} <span className="text-[9px]">sqm</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] text-neutral-400 font-bold uppercase leading-none mb-1">Type</p>
              <p className="text-xs font-black text-neutral-800 leading-none capitalize">
                {land.purpose || 'Land'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-3 bg-neutral-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-600/20 active:scale-95">
          View Details
        </button>
      </div>
    </div>
  );
}
