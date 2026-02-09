"use client";

import Link from "next/link";
import { RealTimeMapView } from "@/components/map/RealTimeMapView";
import { useState, useEffect } from "react";

// Mock listings data - in production, fetch from API
const mockListings = [
  {
    id: "1",
    location: {
      country: "Sierra Leone",
      community: "Freetown Central",
      chiefdom: "Western Urban",
      district: "Western Area",
      coordinates: [8.4840, -13.2299] as [number, number],
    },
    price: 125000,
    size: 2500,
    sizeUnit: "sqm" as const,
    purpose: "Residential",
    verificationScore: 95,
  },
  {
    id: "2",
    location: {
      country: "Sierra Leone",
      community: "Bo Town Commercial",
      chiefdom: "Bo Urban",
      district: "Bo",
      coordinates: [7.9553, -11.7396] as [number, number],
    },
    price: 285000,
    size: 8500,
    sizeUnit: "sqm" as const,
    purpose: "Commercial",
    verificationScore: 88,
  },
  {
    id: "3",
    location: {
      country: "Sierra Leone",
      community: "Makeni Agricultural",
      chiefdom: "Makeni Urban",
      district: "Bombali",
      coordinates: [8.8846, -12.0447] as [number, number],
    },
    price: 45000,
    size: 45000,
    sizeUnit: "sqm" as const,
    purpose: "Agricultural",
    verificationScore: 79,
  },
  {
    id: "4",
    location: {
      country: "Sierra Leone",
      community: "Kenema Business District",
      chiefdom: "Kenema Urban",
      district: "Kenema",
      coordinates: [7.8763, -11.1902] as [number, number],
    },
    price: 385000,
    size: 15000,
    sizeUnit: "sqm" as const,
    purpose: "Mixed Use",
    verificationScore: 92,
  },
];

export default function MapPage() {
  const [listings, setListings] = useState(mockListings);

  // In production, fetch listings from API
  useEffect(() => {
    // Fetch listings from API
    // fetch('/api/land/listings')
    //   .then(res => res.json())
    //   .then(data => setListings(data));
  }, []);

  return (
    <div className="w-full h-[calc(100vh-5rem)] relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Link
          href="/landing"
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Full Screen Map */}
      <RealTimeMapView
        listings={listings}
        onListingSelect={(id) => {
          window.location.href = `/land/${id}`;
        }}
        height="100%"
      />
    </div>
  );
}
