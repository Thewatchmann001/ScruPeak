"use client";

import { useMemo } from "react";

interface PriceTrend {
  month: string;
  price: number;
  volume: number;
}

interface DistrictData {
  district: string;
  avgPrice: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  listings: number;
}

export function MarketInsightsDashboard() {
  const districtData: DistrictData[] = [
    {
      district: "Western Area",
      avgPrice: 45000,
      trend: "up",
      trendPercent: 12,
      listings: 34,
    },
    {
      district: "Bo",
      avgPrice: 28000,
      trend: "up",
      trendPercent: 8,
      listings: 22,
    },
    {
      district: "Kenema",
      avgPrice: 32000,
      trend: "down",
      trendPercent: -3,
      listings: 18,
    },
    {
      district: "Makeni",
      avgPrice: 25000,
      trend: "stable",
      trendPercent: 1,
      listings: 15,
    },
  ];

  const trendData: PriceTrend[] = [
    { month: "Jan", price: 38000, volume: 12 },
    { month: "Feb", price: 39500, volume: 14 },
    { month: "Mar", price: 41000, volume: 18 },
    { month: "Apr", price: 42000, volume: 22 },
    { month: "May", price: 44000, volume: 26 },
    { month: "Jun", price: 46000, volume: 32 },
  ];

  const maxPrice = Math.max(...trendData.map((d) => d.price));
  const maxVolume = Math.max(...trendData.map((d) => d.volume));

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
              $37,500
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 8% YoY</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Active Listings
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              89
            </p>
            <p className="text-xs text-neutral-600 mt-2">+12 this month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Verified Parcels
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              76%
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 5% from last month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Avg Days to Sell
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              24 days
            </p>
            <p className="text-xs text-neutral-600 mt-2">-2 days vs last month</p>
          </div>
        </div>

        {/* Price Trend Chart */}
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Average Land Price Trend
          </h2>
          <div className="h-64 flex items-end justify-between gap-3">
            {trendData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="relative w-full h-48 flex items-end justify-center">
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity relative group"
                    style={{
                      height: `${(data.price / maxPrice) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-semibold text-neutral-900">
                        ${(data.price / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 mt-2">{data.month}</p>
              </div>
            ))}
          </div>
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
            {districtData.map((data, idx) => (
              <div key={idx} className="pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {data.district}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {data.listings} active listings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      ${(data.avgPrice / 1000).toFixed(0)}K
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        data.trend === "up"
                          ? "text-green-600"
                          : data.trend === "down"
                          ? "text-red-600"
                          : "text-neutral-600"
                      }`}
                    >
                      {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→"}{" "}
                      {Math.abs(data.trendPercent)}%
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600"
                    style={{
                      width: `${(data.avgPrice / 50000) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Corridors */}
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

        {/* Risk Heatmap */}
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
