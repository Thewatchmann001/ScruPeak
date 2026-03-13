"use client";

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MarketInsights() {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">
              Market <span className="text-primary">Intelligence</span>
            </h2>
            <p className="text-gray-600">Real-time insights into Sierra Leone's land market</p>
          </div>
          <Link to="/insights">
            <Button variant="outline" className="hidden md:flex">
              View Full Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Price Trends */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary transition-all hover:shadow-lg">
            <h3 className="text-xl font-black text-gray-900 mb-4">Price Trends</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Western Area</span>
                  <span className="text-lg font-black text-primary">↑ 12%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Bo Region</span>
                  <span className="text-lg font-black text-primary">↑ 8%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: "65%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Kenema</span>
                  <span className="text-lg font-black text-primary">↓ 3%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500" style={{ width: "55%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Development Hotspots */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary transition-all hover:shadow-lg">
            <h3 className="text-xl font-black text-gray-900 mb-4">Development Hotspots</h3>
            <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-600">Interactive map</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">Primary Zone:</span> Western Area Urban
            </p>
          </div>

          {/* Risk & Accessibility */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary transition-all hover:shadow-lg">
            <h3 className="text-xl font-black text-gray-900 mb-4">Risk Assessment</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Flood Risk</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Low</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Title Disputes</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                    84% Clear
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Accessibility</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary/90 text-xs font-bold rounded">
                    Good
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
