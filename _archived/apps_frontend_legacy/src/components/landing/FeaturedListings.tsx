"use client";

import { ZillowCard } from "./ZillowCard";

export function FeaturedListings() {
  const featuredProperties = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1500382017468-f049863aab22?w=600&h=400&fit=crop",
      price: 125000,
      location: {
        community: "Freetown Central",
        chiefdom: "Western Urban",
        district: "Western Area",
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
        community: "Bo Town Commercial",
        chiefdom: "Bo Urban",
        district: "Bo",
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
        community: "Makeni Agricultural",
        chiefdom: "Makeni Urban",
        district: "Bombali",
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
        community: "Kenema Business District",
        chiefdom: "Kenema Urban",
        district: "Kenema",
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
        community: "Port Loko Waterfront",
        chiefdom: "Port Loko Urban",
        district: "Port Loko",
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
        community: "Waterloo Development Zone",
        chiefdom: "Western Rural",
        district: "Western Area",
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
    <section className="bg-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-orange-600 rounded-full" />
            <span className="text-orange-600 font-bold text-sm uppercase tracking-widest">Hot Properties</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">Featured Listings</h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            Discover the most verified and sought-after land properties across Sierra Leone. Updated daily with the latest market opportunities.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12 pb-12 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Average Price</p>
            <p className="text-2xl font-black text-orange-600">₤195K</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Avg Verification</p>
            <p className="text-2xl font-black text-green-600">89%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Recent Sales</p>
            <p className="text-2xl font-black text-blue-600">342</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Market Trend</p>
            <p className="text-2xl font-black text-green-600">↑ 12%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Avg Days</p>
            <p className="text-2xl font-black text-gray-900">14</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 uppercase font-bold">Disputes</p>
            <p className="text-2xl font-black text-green-600">0</p>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProperties.map((property) => (
            <ZillowCard key={property.id} {...property} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/explore"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Browse All {featuredProperties.length + 500}+ Properties
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
