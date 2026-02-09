"use client";

import { Link } from "react-router-dom";
import { VerificationIndicator } from "@/components/verification/VerificationUI";

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
  const riskColor = riskLevel === "low" ? "bg-green-100 text-green-800" : riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  return (
    <Link to={`/land/${id}`}>
      <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
        {/* Image Container */}
        <div className="relative h-64 md:h-72 overflow-hidden bg-gray-200">
          <img
            src={image}
            alt={`${location.community}, ${location.district}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Save Button */}
          <button className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110 z-10">
            <svg
              className={`w-5 h-5 ${isSaved ? "text-orange-600 fill-current" : "text-gray-600"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          {/* Verification Badge */}
          <div className="absolute top-3 left-3 z-10">
            <VerificationIndicator score={verificationScore} risk={riskLevel as "low" | "medium" | "high"} />
          </div>

          {/* Days on Market */}
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
            {daysOnMarket} days on market
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
            ₤{(price / 1000).toFixed(0)}K
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5">
          {/* Location */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
              {location.district} • {location.chiefdom}
            </p>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
              {location.community}
            </h3>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-600">Size</p>
              <p className="font-bold text-gray-900">
                {size.toLocaleString()} {sizeUnit === "sqm" ? "sqm" : "ac"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Type</p>
              <p className="font-bold text-gray-900 text-sm">{purpose}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className={`font-bold text-xs py-1 px-2 rounded ${riskColor} text-center`}>
                {riskLevel === "low" ? "✓ Verified" : riskLevel === "medium" ? "⚠ Trusted" : "⚠ Flagged"}
              </p>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  riskLevel === "low"
                    ? "bg-green-500"
                    : riskLevel === "medium"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${verificationScore}%` }}
              />
            </div>
            <span className="font-bold text-gray-700">{verificationScore}%</span>
          </div>

          {/* View Details CTA */}
          <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all transform group-hover:shadow-md">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
