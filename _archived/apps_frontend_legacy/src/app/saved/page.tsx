"use client";

import { LandCard } from "@/components/land/LandCard";

const mockSavedLands = [
  {
    id: "1",
    location: {
      country: "Sierra Leone",
      district: "Western Area",
      chiefdom: "Western Urban",
      community: "Freetown",
    },
    size: 2500,
    sizeUnit: "sqm" as const,
    purpose: "Residential",
    price: 45000,
    verificationScore: 92,
  },
  {
    id: "2",
    location: {
      country: "Sierra Leone",
      district: "Bo",
      chiefdom: "Bo Urban",
      community: "Bo Town",
    },
    size: 3200,
    sizeUnit: "acres" as const,
    purpose: "Agricultural",
    price: 28000,
    verificationScore: 78,
  },
];

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-b border-neutral-200 bg-white">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Saved Land Parcels
        </h1>
        <p className="text-lg text-neutral-600">
          Your collection of favorite land listings
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockSavedLands.map((land) => (
            <LandCard key={land.id} {...land} />
          ))}
        </div>

        {mockSavedLands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg">No saved lands yet</p>
            <p className="text-neutral-500">Start exploring and save your favorites</p>
          </div>
        )}
      </div>
    </div>
  );
}
