"use client";

interface LandCardProps {
  id: string;
  location: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
  };
  size: number;
  sizeUnit: "sqm" | "acres";
  purpose: string;
  price: number;
  verificationScore: number;
  image?: string;
  onSelect?: (id: string) => void;
}

export function LandCard({
  id,
  location,
  size,
  sizeUnit,
  purpose,
  price,
  verificationScore,
  image,
  onSelect,
}: LandCardProps) {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className="group bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-soft hover:shadow-elevation transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      {image && (
        <div className="h-48 bg-neutral-100 overflow-hidden relative">
          <img
            src={image}
            alt={`${location.community}, ${location.chiefdom}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-10" />
        </div>
      )}

      <div className="p-5">
        {/* Location */}
        <div className="mb-4">
          <p className="text-xs text-neutral-500 mb-1">
            {location.country} • {location.district}
          </p>
          <p className="text-sm font-semibold text-neutral-900 mb-1">
            {location.community}, {location.chiefdom}
          </p>
          <p className="text-xs text-neutral-600">
            {size.toLocaleString()} {sizeUnit} • {purpose}
          </p>
        </div>

        {/* Price */}
        <div className="mb-4 pb-4 border-b border-neutral-100">
          <p className="text-2xl font-bold text-neutral-900">
            ${price.toLocaleString()}
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
          <p className="text-xs text-neutral-600 mt-2">
            ✓ Survey Verified • ✓ Community Confirmed
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
