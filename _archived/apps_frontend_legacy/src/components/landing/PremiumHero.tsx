"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PremiumHero() {
  const router = useRouter();
  const [district, setDistrict] = useState("");
  const [landType, setLandType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    if (landType) params.append("type", landType);
    if (purpose) params.append("purpose", purpose);
    if (budget) params.append("budget", budget);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map Background with Satellite Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        {/* Animated satellite grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0h60v60H0z\" fill=\"%23000\"/><circle cx=\"30\" cy=\"30\" r=\"25\" fill=\"none\" stroke=\"%23FF6600\" stroke-width=\"0.5\" opacity=\"0.3\"/><line x1=\"0\" y1=\"30\" x2=\"60\" y2=\"30\" stroke=\"%23FF6600\" stroke-width=\"0.3\" opacity=\"0.2\"/><line x1=\"30\" y1=\"0\" x2=\"30\" y2=\"60\" stroke=\"%23FF6600\" stroke-width=\"0.3\" opacity=\"0.2\"/></svg>')",
            animation: "fadeInMap 0.8s ease-in-out",
          }}
        />

        {/* Orange accent glow */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-10 animate-pulse" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 py-20">
        {/* Tagline */}
        <div className="mb-8 animate-fadeInUp">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest">
            Verified Land Marketplace
          </p>
        </div>

        {/* Main Heading */}
        <h1
          className="text-5xl md:text-7xl font-black text-white mb-4 text-center leading-tight animate-fadeInUp"
          style={{ animationDelay: "0.1s" }}
        >
          Find <span className="text-orange-500">Verified</span> Land
        </h1>

        {/* Subheading */}
        <p
          className="text-lg md:text-xl text-gray-300 text-center mb-12 max-w-2xl animate-fadeInUp"
          style={{ animationDelay: "0.2s" }}
        >
          Verified survey plans. Community confirmed. Family ownership disclosed. Zero court disputes.
        </p>

        {/* Search Bar */}
        <div
          className="w-full max-w-5xl mb-8 animate-fadeInUp"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-1 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4">
              {/* District */}
              <div>
                <input
                  type="text"
                  placeholder="District/Chiefdom"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Land Type */}
              <div>
                <select
                  value={landType}
                  onChange={(e) => setLandType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">Land Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>

              {/* Purpose */}
              <div>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">Purpose</option>
                  <option value="build">Build Home</option>
                  <option value="invest">Invest</option>
                  <option value="farm">Farm</option>
                  <option value="develop">Develop</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">Budget (USD)</option>
                  <option value="0-5000">Under $5K</option>
                  <option value="5000-25000">$5K - $25K</option>
                  <option value="25000-100000">$25K - $100K</option>
                  <option value="100000+">$100K+</option>
                </select>
              </div>

              {/* Search Button */}
              <div>
                <button
                  onClick={handleSearch}
                  className="w-full px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  Explore
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSearch}
          className="px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105 hover:shadow-2xl shadow-lg animate-fadeInUp"
          style={{ animationDelay: "0.4s" }}
        >
          Explore Land
        </button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <svg
          className="w-6 h-6 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes fadeInMap {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
