"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Restored: Import directly from node_modules for offline support
import { SpatialGridLayer } from "./SpatialGridLayer";

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
  parcel_id?: string;
  ulid?: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  price: number;
  size_sqm: number;
  region: string;
  district: string;
  status: string;
  boundary?: string; // WKT or geojson? Assume WKT for now based on backend
  verificationScore?: number;
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
      (listing) => listing.latitude && listing.longitude
    );

    if (validListings.length === 0) {
      // Default to Sierra Leone center if no valid coordinates
      map.setView([8.4606, -11.7799], 7);
      return;
    }

    if (selectedListingId) {
      const selected = validListings.find((l) => l.id === selectedListingId);
      if (selected) {
        map.setView([selected.latitude, selected.longitude], 17);
      }
    } else {
      // Fit bounds to show all listings
      const bounds = L.latLngBounds(
        validListings.map((l) => [l.latitude, l.longitude] as [number, number])
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

  // No need to generate mock coords anymore if backend is providing them
  const listingsWithCoords = listings;

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
        <SpatialGridLayer />
        <MapUpdater listings={listingsWithCoords} selectedListingId={selectedListingId} />

        {listingsWithCoords.map((listing) => {
          if (!listing.latitude || !listing.longitude) return null;

          const isSelected = listing.id === selectedListingId;
          const markerColor = isSelected ? "#ef4444" : "#0ea5e9";
          const center: [number, number] = [listing.latitude, listing.longitude];

          // Calculate representative boundary if not provided (square centered at marker)
          let boundaryCoords: [number, number][] = [];
          if (listing.boundary) {
             // Basic WKT parsing (rough)
             const match = listing.boundary.match(/\(\((.*)\)\)/);
             if (match) {
               boundaryCoords = match[1].split(',').map(pair => {
                 const [lng, lat] = pair.trim().split(' ').map(Number);
                 return [lat, lng] as [number, number];
               });
             }
          } else if (listing.size_sqm) {
             // Use our coordinate system knowledge to calculate accurate square
             const side = Math.sqrt(listing.size_sqm);
             const halfSide = side / 2;

             // Rough approximation in degrees (approx 111,000m per degree)
             const latOffset = halfSide / 111000;
             const lngOffset = halfSide / (111000 * Math.cos(listing.latitude * Math.PI / 180));

             boundaryCoords = [
               [listing.latitude - latOffset, listing.longitude - lngOffset],
               [listing.latitude - latOffset, listing.longitude + lngOffset],
               [listing.latitude + latOffset, listing.longitude + lngOffset],
               [listing.latitude + latOffset, listing.longitude - lngOffset],
               [listing.latitude - latOffset, listing.longitude - lngOffset],
             ];
          }

          return (
            <div key={listing.id}>
              {/* Boundary Polygon */}
              {boundaryCoords.length > 0 && (
                <Polygon
                  positions={boundaryCoords}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: isSelected ? 0.4 : 0.2,
                    weight: isSelected ? 3 : 1,
                  }}
                  eventHandlers={{
                    click: () => onListingClick?.(listing.id),
                  }}
                >
                  <Tooltip permanent={isSelected && mapType === 'roadmap'} direction="top">
                    <span className="font-bold text-xs">{listing.parcel_id || 'Pending ID'}</span>
                  </Tooltip>
                </Polygon>
              )}

              {/* Marker */}
              <CircleMarker
                center={center}
                radius={isSelected ? 6 : 4}
                pathOptions={{
                  color: markerColor,
                  fillColor: "#fff",
                  fillOpacity: 1,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onListingClick?.(listing.id),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                        {listing.parcel_id || 'ID Pending'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        listing.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {listing.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{listing.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {listing.district}, {listing.region}
                    </p>
                    <div className="space-y-1 text-sm border-t pt-2">
                      <p className="font-bold text-orange-600 text-lg">
                        Le {listing.price.toLocaleString()}
                      </p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <span className="font-semibold text-gray-900">{listing.size_sqm.toLocaleString()}</span> sqm
                      </p>
                    </div>
                    {onListingClick && (
                      <button
                        onClick={() => onListingClick(listing.id)}
                        className="mt-3 w-full px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-md"
                      >
                        VIEW PROPERTY DETAILS
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t border-dashed border-orange-400"></div>
            <span className="text-gray-600">Spatial Grid (2km)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
