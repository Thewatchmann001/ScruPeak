"use client";

import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface PriceTrend {
  month: string;
  avg_price: number;
  listing_volume: number;
}

interface DistrictData {
  district: string;
  avg_price: number;
  trend_percent: number;
  listing_count: number;
}

interface MarketInsights {
  district_stats: DistrictData[];
  price_trends: PriceTrend[];
  total_listings: number;
  active_listings: number;
  sold_listings: number;
}

export function MarketInsightsDashboard() {
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await api.get<MarketInsights>("/land/insights");
        setInsights(response.data);
      } catch (err) {
        console.error("Failed to fetch market insights:", err);
        setError("Failed to load market data");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
           <div className="text-neutral-300 mb-4">
             <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
           </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Insights Loading...</h3>
          <p className="text-gray-500 mb-6 text-sm">Gathering the latest market data for you.</p>
        </div>
      </div>
    );
  }

  const { district_stats, price_trends, active_listings, sold_listings } = insights;
  
  // Calculate overall average price from district stats
  const overallAvgPrice = district_stats.length > 0
    ? district_stats.reduce((sum, d) => sum + d.avg_price, 0) / district_stats.length
    : 0;

  const maxPrice = price_trends.length > 0 
    ? Math.max(...price_trends.map((d) => d.avg_price)) 
    : 100000; // Default fallback

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-b border-neutral-200 bg-white">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Market Insights
        </h1>
        <p className="text-lg text-neutral-600">
          Real-time land market analytics and trends for Sierra Leone
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Avg Land Price
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              ${overallAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-green-600 mt-2">Based on active listings</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Active Listings
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {active_listings}
            </p>
            <p className="text-xs text-neutral-600 mt-2">Properties available now</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Sold Properties
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {sold_listings}
            </p>
            <p className="text-xs text-green-600 mt-2">Total completed sales</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Districts Tracked
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {district_stats.length}
            </p>
            <p className="text-xs text-neutral-600 mt-2">Across Sierra Leone</p>
          </div>
        </div>

        {/* Price Trend Chart */}
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Average Land Price Trend
          </h2>
          {price_trends.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-3">
              {price_trends.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full h-48 flex items-end justify-center">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity relative group"
                      style={{
                        height: `${(data.avg_price / (maxPrice || 1)) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs font-semibold text-neutral-900">
                          ${(data.avg_price / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{data.month}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-500">
              No trend data available yet
            </div>
          )}
          <p className="text-xs text-neutral-600 text-center mt-6">
            Showing 6-month average land prices
          </p>
        </div>

        {/* District Breakdown */}
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Price by District
          </h2>
          <div className="space-y-4">
            {district_stats.map((data, idx) => (
              <div key={idx} className="pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {data.district}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {data.listing_count} active listings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      ${(data.avg_price / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600"
                    style={{
                      width: `${(data.avg_price / (overallAvgPrice * 1.5 || 100000)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {district_stats.length === 0 && (
               <div className="text-center text-neutral-500 py-4">
                 No district data available
               </div>
            )}
          </div>
        </div>

        {/* Development Corridors - Static Placeholder */}
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Development Corridors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-lg p-6">
              <h4 className="font-semibold text-neutral-900 mb-2">
                Primary Growth Zone
              </h4>
              <p className="text-sm text-neutral-600 mb-4">
                Western Area • 42% price growth YoY
              </p>
              <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "42%" }} />
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-6">
              <h4 className="font-semibold text-neutral-900 mb-2">
                Secondary Growth Zone
              </h4>
              <p className="text-sm text-neutral-600 mb-4">
                Bo & Kenema • 18% price growth YoY
              </p>
              <div className="w-full h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: "18%" }} />
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-6">
              <h4 className="font-semibold text-neutral-900 mb-2">
                Emerging Zone
              </h4>
              <p className="text-sm text-neutral-600 mb-4">
                Northern Region • 8% price growth YoY
              </p>
              <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: "8%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Heatmap - Static Placeholder */}
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Risk Concentration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Flood Risk</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">Low Risk:</span>
                  <div className="flex-1 mx-4 h-2 bg-green-100 rounded-full">
                    <div className="h-full bg-green-500" style={{ width: "68%" }} />
                  </div>
                  <span className="text-sm font-semibold">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">Medium Risk:</span>
                  <div className="flex-1 mx-4 h-2 bg-yellow-100 rounded-full">
                    <div className="h-full bg-yellow-500" style={{ width: "22%" }} />
                  </div>
                  <span className="text-sm font-semibold">22%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">High Risk:</span>
                  <div className="flex-1 mx-4 h-2 bg-red-100 rounded-full">
                    <div className="h-full bg-red-500" style={{ width: "10%" }} />
                  </div>
                  <span className="text-sm font-semibold">10%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Title Disputes</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">Clear Title:</span>
                  <div className="flex-1 mx-4 h-2 bg-green-100 rounded-full">
                    <div className="h-full bg-green-500" style={{ width: "84%" }} />
                  </div>
                  <span className="text-sm font-semibold">84%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">Disputed:</span>
                  <div className="flex-1 mx-4 h-2 bg-red-100 rounded-full">
                    <div className="h-full bg-red-500" style={{ width: "16%" }} />
                  </div>
                  <span className="text-sm font-semibold">16%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
