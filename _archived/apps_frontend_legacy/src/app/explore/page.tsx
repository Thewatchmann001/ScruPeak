"use client";

import Link from "next/link";
import { useState } from "react";
import { ZillowCard } from "@/components/landing/ZillowCard";
import { RealTimeMapView } from "@/components/map/RealTimeMapView";

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(true);

  const mockLands = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1500382017468-f049863aab22?w=600&h=400&fit=crop",
      price: 125000,
      location: {
        country: "Sierra Leone",
        community: "Freetown Central",
        chiefdom: "Western Urban",
        district: "Western Area",
        coordinates: [8.4840, -13.2299] as [number, number], // Freetown coordinates
      },
      size: 2500,
      sizeUnit: "sqm" as const,
      purpose: "Residential",
      verificationScore: 95,
      daysOnMarket: 3,
      isSaved: false,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&h=400&fit=crop",
      price: 285000,
      location: {
        country: "Sierra Leone",
        community: "Bo Town Commercial",
        chiefdom: "Bo Urban",
        district: "Bo",
        coordinates: [7.9553, -11.7396] as [number, number], // Bo coordinates
      },
      size: 8500,
      sizeUnit: "sqm" as const,
      purpose: "Commercial",
      verificationScore: 88,
      daysOnMarket: 12,
      isSaved: false,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
      price: 45000,
      location: {
        country: "Sierra Leone",
        community: "Makeni Agricultural",
        chiefdom: "Makeni Urban",
        district: "Bombali",
        coordinates: [8.8846, -12.0447] as [number, number], // Makeni coordinates
      },
      size: 45000,
      sizeUnit: "sqm" as const,
      purpose: "Agricultural",
      verificationScore: 79,
      daysOnMarket: 28,
      isSaved: false,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1567605022519-4509c7f76c43?w=600&h=400&fit=crop",
      price: 385000,
      location: {
        country: "Sierra Leone",
        community: "Kenema Business District",
        chiefdom: "Kenema Urban",
        district: "Kenema",
        coordinates: [7.8763, -11.1902] as [number, number], // Kenema coordinates
      },
      size: 15000,
      sizeUnit: "sqm" as const,
      purpose: "Mixed Use",
      verificationScore: 92,
      daysOnMarket: 7,
      isSaved: true,
    },
    {
      id: "5",
      image: "https://images.unsplash.com/photo-1506171613408-eca07ce68773?w=600&h=400&fit=crop",
      price: 75000,
      location: {
        country: "Sierra Leone",
        community: "Port Loko Waterfront",
        chiefdom: "Port Loko Urban",
        district: "Port Loko",
        coordinates: [8.7667, -12.7833] as [number, number], // Port Loko coordinates
      },
      size: 5000,
      sizeUnit: "sqm" as const,
      purpose: "Residential",
      verificationScore: 85,
      daysOnMarket: 15,
      isSaved: false,
    },
    {
      id: "6",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&h=400&fit=crop",
      price: 225000,
      location: {
        country: "Sierra Leone",
        community: "Waterloo Development Zone",
        chiefdom: "Western Rural",
        district: "Western Area",
        coordinates: [8.3389, -13.0714] as [number, number], // Waterloo coordinates
      },
      size: 12000,
      sizeUnit: "sqm" as const,
      purpose: "Investment",
      verificationScore: 91,
      daysOnMarket: 5,
      isSaved: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link
              href="/landing"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Landing
            </Link>

            {/* View Modes */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded transition-all ${viewMode === "grid" ? "bg-white shadow" : "text-gray-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded transition-all ${viewMode === "list" ? "bg-white shadow" : "text-gray-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 rounded transition-all ${viewMode === "map" ? "bg-white shadow" : "text-gray-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6.553 3.276A1 1 0 0021 20.382V9.618a1 1 0 00-1.447-.894L15 11m0 13V11m0 0L9 7" />
                </svg>
              </button>
            </div>

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Filters</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Search by district..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Land Type */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">Land Type</label>
                <div className="space-y-2">
                  {["Residential", "Commercial", "Agricultural", "Industrial"].map((type) => (
                    <label key={type} className="flex items-center">
                      <input type="checkbox" className="rounded text-orange-600" />
                      <span className="ml-3 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verification Score */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">Verification Score</label>
                <div className="space-y-2">
                  {["90% and above (Verified)", "70-89% (Trusted)", "50-69% (Caution)", "All listings"].map((score) => (
                    <label key={score} className="flex items-center">
                      <input type="radio" name="score" className="text-orange-600" />
                      <span className="ml-3 text-sm text-gray-700">{score}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Sort By</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Verification Score</option>
                  <option>Most Saved</option>
                </select>
              </div>

              <button className="w-full px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
                Search
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {mockLands.length} Properties Found
            </h2>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLands.map((land) => (
                <ZillowCard key={land.id} {...land} />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {mockLands.map((land) => (
                <Link key={land.id} href={`/land/${land.id}`}>
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all flex gap-6 cursor-pointer group">
                    <img src={land.image} alt="" className="w-40 h-40 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-semibold uppercase">
                        {land.location.district} • {land.location.chiefdom}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {land.location.community}
                      </h3>
                      <p className="text-gray-600 mt-1">{land.purpose} • {land.size.toLocaleString()} {land.sizeUnit}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-3xl font-black text-orange-600">₤{(land.price / 1000).toFixed(0)}K</span>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Verification</p>
                          <p className="text-lg font-bold text-green-600">{land.verificationScore}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Map View */}
          {viewMode === "map" && (
            <div className="rounded-lg overflow-hidden shadow-lg min-h-[600px]">
              <RealTimeMapView
                listings={mockLands.map((land) => ({
                  id: land.id,
                  location: land.location,
                  price: land.price,
                  size: land.size,
                  sizeUnit: land.sizeUnit,
                  purpose: land.purpose,
                  verificationScore: land.verificationScore,
                  image: land.image,
                }))}
                onListingSelect={(id) => {
                  // Navigate to land detail page
                  window.location.href = `/land/${id}`;
                }}
                height="600px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
