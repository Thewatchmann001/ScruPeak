"use client";

import { useEffect, useState } from "react";
import { InteractiveMap } from "./InteractiveMap";

interface LandListing {
  id: string;
  location: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
    coordinates?: [number, number];
    bounds?: [[number, number], [number, number], [number, number], [number, number]];
  };
  price: number;
  size: number;
  sizeUnit: "sqm" | "acres";
  purpose: string;
  verificationScore: number;
  image?: string;
}

interface RealTimeMapViewProps {
  listings: LandListing[];
  onListingSelect?: (listingId: string) => void;
  refreshInterval?: number; // milliseconds
  height?: string;
}

export function RealTimeMapView({
  listings,
  onListingSelect,
  refreshInterval = 30000, // 30 seconds default
  height = "100%",
}: RealTimeMapViewProps) {
  const [currentListings, setCurrentListings] = useState(listings);
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(true);

  // Simulate real-time updates (in production, this would be WebSocket or polling)
  useEffect(() => {
    setCurrentListings(listings);
    setLastUpdate(new Date());

    // Set up polling for updates (in production, use WebSocket)
    const interval = setInterval(() => {
      // In production, fetch updated listings from API
      // For now, we'll just update the timestamp
      setLastUpdate(new Date());
      setIsConnected(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [listings, refreshInterval]);

  const handleListingClick = (listingId: string) => {
    setSelectedListingId(listingId);
    onListingSelect?.(listingId);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Status Bar */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
        <div className="text-xs">
          <p className="font-medium text-gray-900">
            {currentListings.length} {currentListings.length === 1 ? "listing" : "listings"}
          </p>
          <p className="text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Map */}
      <InteractiveMap
        listings={currentListings}
        selectedListingId={selectedListingId}
        onListingClick={handleListingClick}
        height={height}
        showControls={true}
      />
    </div>
  );
}
