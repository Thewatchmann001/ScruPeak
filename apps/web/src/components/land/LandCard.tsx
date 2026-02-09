"use client";

import { Land } from "@/types";

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

  return (
    <div
      onClick={() => onSelect?.(land.id)}
      className="group bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-soft hover:shadow-elevation transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="h-48 bg-neutral-100 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={land.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Land+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-10" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            land.status === 'available' ? 'bg-green-100 text-green-700' :
            land.status === 'sold' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {land.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Location */}
        <div className="mb-4">
          <p className="text-xs text-neutral-500 mb-1">
            Sierra Leone • {land.district}
          </p>
          <p className="text-sm font-semibold text-neutral-900 mb-1 truncate">
            {land.title}
          </p>
          <p className="text-xs text-neutral-600">
            {land.region}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {land.size_sqm.toLocaleString()} sqm
          </p>
          {land.classification && (
            <p className="text-xs text-blue-600 mt-1 font-medium">
              {land.classification.name} {land.classification.is_state_land && '(State Land)'}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mb-4 pb-4 border-b border-neutral-100">
          <p className="text-2xl font-bold text-neutral-900">
            {land.price ? `$${land.price.toLocaleString()}` : 'Price on Request'}
          </p>
        </div>

        {/* Verification Badge */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${verificationScore}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-neutral-700">
              {verificationScore}%
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 flex items-center gap-1">
            {land.blockchain_hash ? (
               <>✓ Blockchain Verified</>
            ) : (
               <>• Verification Pending</>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
            Quick View
          </button>
          <button className="flex-1 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
}
