"use client";

import { useEffect, useState } from "react";
import { ZillowCard } from "./ZillowCard";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function FeaturedListings() {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleViewMarketplace = () => {
    if (!user) {
      navigate("/auth/login?redirect=/marketplace");
    } else {
      navigate("/marketplace");
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get<any>("/land?page_size=6"); // Fetch 6 items
        const items = response.data.items || [];
        
        // Map API data to ZillowCard props
        const mappedProperties = items.map((item: any) => ({
          id: item.id,
          // Use a placeholder image if none provided (backend doesn't seem to return images yet in the list endpoint based on previous checks, but let's assume it might or use a placeholder)
          image: "https://images.unsplash.com/photo-1500382017468-f049863aab22?w=600&h=400&fit=crop", 
          price: Number(item.price),
          location: {
            community: item.title, // Using title as community/area name for now
            chiefdom: item.region,
            district: item.district,
          },
          size: Number(item.size_sqm),
          sizeUnit: "sqm",
          purpose: "Residential", // Default or derive from description
          verificationScore: 95, // Mock score for now as backend might not return it yet
          daysOnMarket: Math.floor(Math.random() * 30), // Mock
          isSaved: false,
        }));
        
        setFeaturedProperties(mappedProperties);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
      </section>
    );
  }

  // Empty state - No mock data allowed
  if (!loading && featuredProperties.length === 0) {
    return (
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <div className="w-1 h-8 bg-orange-600 rounded-full" />
              <span className="text-orange-600 font-bold text-sm uppercase tracking-widest">Hot Properties</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">Featured Listings</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the most verified and sought-after land properties across Sierra Leone.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-12 border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Listings Available Yet</h3>
              <p className="text-gray-500 max-w-md mb-8">
                We are currently verifying new properties. Check back soon.
              </p>
              <button
                onClick={handleViewMarketplace}
                className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
              >
                View Marketplace
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Browse All {featuredProperties.length}+ Properties
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
