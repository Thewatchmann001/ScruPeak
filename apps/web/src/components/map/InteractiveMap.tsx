"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface LandListing {
  id: string;
  location: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
    coordinates?: [number, number]; // [lat, lng]
    bounds?: [[number, number], [number, number], [number, number], [number, number]]; // Polygon bounds
  };
  price: number;
  size: number;
  sizeUnit: "sqm" | "acres";
  purpose: string;
  verificationScore: number;
  image?: string;
}

interface InteractiveMapProps {
  listings: LandListing[];
  selectedListingId?: string;
  onListingClick?: (listingId: string) => void;
  height?: string;
  showControls?: boolean;
  mapType?: "roadmap" | "satellite" | "terrain";
}

// Component to handle map updates when listings change
function MapUpdater({ listings, selectedListingId }: { listings: LandListing[]; selectedListingId?: string }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;

    const validListings = listings.filter(
      (listing) => listing.location.coordinates && listing.location.coordinates.length === 2
    );

    if (validListings.length === 0) {
      // Default to Sierra Leone center if no valid coordinates
      map.setView([8.4606, -11.7799], 7);
      return;
    }

    if (selectedListingId) {
      const selected = validListings.find((l) => l.id === selectedListingId);
      if (selected?.location.coordinates) {
        map.setView(selected.location.coordinates, 15);
      }
    } else {
      // Fit bounds to show all listings
      const bounds = L.latLngBounds(
        validListings.map((l) => l.location.coordinates! as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [listings, selectedListingId, map]);

  return null;
}

export function InteractiveMap({
  listings,
  selectedListingId,
  onListingClick,
  height = "600px",
  showControls = true,
  mapType = "roadmap",
}: InteractiveMapProps) {
  const [currentMapType, setCurrentMapType] = useState(mapType);
  const [isClient, setIsClient] = useState(false);

  // Default coordinates for Sierra Leone (if listings don't have coordinates)
  const defaultCenter: [number, number] = [8.4606, -11.7799];
  const defaultZoom = 7;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get tile layer URL based on map type
  const getTileUrl = () => {
    switch (currentMapType) {
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "terrain":
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  // Get attribution based on map type
  const getAttribution = () => {
    switch (currentMapType) {
      case "satellite":
        return "&copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community";
      case "terrain":
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Generate coordinates for listings that don't have them (mock data for demo)
  const listingsWithCoords = listings.map((listing, index) => {
    if (listing.location.coordinates) {
      return listing;
    }
    // Generate mock coordinates based on index (for demo purposes)
    // In production, these should come from the backend
    const lat = defaultCenter[0] + (Math.random() - 0.5) * 2;
    const lng = defaultCenter[1] + (Math.random() - 0.5) * 2;
    return {
      ...listing,
      location: {
        ...listing.location,
        coordinates: [lat, lng] as [number, number],
      },
    };
  });

  if (!isClient) {
    return (
      <div
        className="bg-gray-200 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer url={getTileUrl()} attribution={getAttribution()} />
        <MapUpdater listings={listingsWithCoords} selectedListingId={selectedListingId} />

        {listingsWithCoords.map((listing) => {
          if (!listing.location.coordinates) return null;

          const isSelected = listing.id === selectedListingId;
          const markerColor = isSelected ? "#ef4444" : "#0ea5e9";

          return (
            <div key={listing.id}>
              {/* Marker */}
              <CircleMarker
                center={listing.location.coordinates}
                radius={isSelected ? 12 : 8}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: 0.7,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onListingClick?.(listing.id),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-gray-900 mb-1">{listing.location.community}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {listing.location.chiefdom}, {listing.location.district}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-primary-600">
                        ${listing.price.toLocaleString()}
                      </p>
                      <p className="text-gray-600">
                        {listing.size.toLocaleString()} {listing.sizeUnit} • {listing.purpose}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-gray-600">Verification:</span>
                        <span
                          className={`text-xs font-bold ${
                            listing.verificationScore >= 80
                              ? "text-green-600"
                              : listing.verificationScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {listing.verificationScore}%
                        </span>
                      </div>
                    </div>
                    {onListingClick && (
                      <button
                        onClick={() => onListingClick(listing.id)}
                        className="mt-3 w-full px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>

              {/* Polygon bounds if available */}
              {listing.location.bounds && (
                <Polygon
                  positions={listing.location.bounds}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onListingClick?.(listing.id),
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <div className="bg-white rounded-lg shadow-lg p-1 flex flex-col">
            <button
              onClick={() => setCurrentMapType("roadmap")}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                currentMapType === "roadmap"
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setCurrentMapType("satellite")}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                currentMapType === "satellite"
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setCurrentMapType("terrain")}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                currentMapType === "terrain"
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Terrain
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-xs font-bold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <span className="text-gray-600">Available Listing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Selected Listing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
