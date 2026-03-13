"use client";

import { Link } from "react-router-dom";

export function ZillowHero() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        <svg className="absolute w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF6600" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Satellite Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Logo & Tagline */}
        <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">LB</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white">ScruPeak</h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 font-light">
            Zillow for Land — Discover, Verify, Invest
          </p>
        </div>

        {/* Advanced Search Container */}
        <div
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Search Tabs */}
          <div className="flex border-b border-gray-200">
            <button className="flex-1 px-6 py-4 font-bold text-primary border-b-2 border-primary bg-gray-50">
              For Sale
            </button>
            <button className="flex-1 px-6 py-4 font-bold text-gray-600 hover:text-gray-900">
              Map View
            </button>
            <button className="flex-1 px-6 py-4 font-bold text-gray-600 hover:text-gray-900">
              Market Insights
            </button>
          </div>

          {/* Search Form */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Location Search */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Location</label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="District, Chiefdom, or Address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Land Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Land Type</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>All Types</option>
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Agricultural</option>
                  <option>Industrial</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Price Range</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Any Price</option>
                  <option>Under ₤50,000</option>
                  <option>₤50,000 - ₤100,000</option>
                  <option>₤100,000 - ₤500,000</option>
                  <option>₤500,000+</option>
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Verification Status</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Any Status</option>
                  <option>Verified (90%+)</option>
                  <option>Trusted (70%+)</option>
                  <option>New Listing</option>
                </select>
              </div>
            </div>

            {/* Advanced Options & CTA */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <button className="text-primary font-semibold hover:text-primary/90 transition-colors">
                + Advanced Filters
              </button>
              <Link
                to="/explore"
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-primary text-white font-bold rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Search Land
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className="w-full max-w-4xl grid grid-cols-3 gap-8 mt-16 text-center animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <div>
            <div className="text-4xl font-black text-primary">2,847</div>
            <div className="text-gray-400 font-medium text-sm mt-2">Verified Properties</div>
          </div>
          <div>
            <div className="text-4xl font-black text-primary">89%</div>
            <div className="text-gray-400 font-medium text-sm mt-2">Community Verified</div>
          </div>
          <div>
            <div className="text-4xl font-black text-primary">Zero</div>
            <div className="text-gray-400 font-medium text-sm mt-2">Court Disputes</div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
          style={{ animationDelay: "0.7s" }}
        >
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
