import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Database } from 'lucide-react';
import { Land } from '@/types';

interface ZillowCardProps {
  listing: Land;
}

export const ZillowCard: React.FC<ZillowCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const photoDoc = listing.documents.find(d =>
    d.document_type === 'photo' || d.document_type === 'land_photo'
  );

  return (
    <div
      className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-standard cursor-pointer group"
      onClick={() => navigate(`/land/${listing.id}`)}
    >
      <div className="relative h-[200px] bg-slate-100 overflow-hidden">
        {photoDoc ? (
          <img
            src={photoDoc.file_url}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface">
            No Image Available
          </div>
        )}

        {/* ULID Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
          ULID: {listing.ulid.substring(0, 8)}...
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="text-2xl font-bold text-primary">
            Le {listing.price?.toLocaleString() || "Contact for Price"}
          </div>
          <div className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-bold text-text-secondary uppercase">
            {listing.status.replace('_', ' ')}
          </div>
        </div>

        <div className="text-sm text-text-secondary font-medium truncate">
          {listing.region}, {listing.district}
        </div>

        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {listing.title}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {listing.blockchain_verified && (
            <div className="px-2 py-1 bg-[#E3F2FD] text-[#1565C0] rounded text-[10px] font-bold uppercase flex items-center gap-1">
              <Database className="w-3 h-3" />
              On-Chain
            </div>
          )}
          <div className="px-2 py-1 bg-success-light text-success rounded text-[10px] font-bold uppercase flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified
          </div>
        </div>

        <button className="w-full mt-4 py-2.5 border border-primary text-primary text-sm font-bold rounded-md hover:bg-primary hover:text-white transition-standard">
          View Details
        </button>
      </div>
    </div>
  );
};
