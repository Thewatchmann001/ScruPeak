"use client";

import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomepageHero() {
  const navigate = useNavigate();
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

    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50 to-secondary-50 opacity-40" />

      {/* Subtle satellite texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0h60v60H0z\" fill=\"%23000\"/><circle cx=\"30\" cy=\"30\" r=\"20\" fill=\"none\" stroke=\"%23fff\" stroke-width=\"1\"/><circle cx=\"30\" cy=\"30\" r=\"15\" fill=\"none\" stroke=\"%23fff\" stroke-width=\"0.5\"/></svg>')",
        }}
      />

      <div className="relative z-10">
        {/* Hero Content */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Land <span className="text-primary-600">verified</span> by community
            </h1>
            <p className="text-xl text-neutral-600 mb-2 max-w-2xl mx-auto">
              Explore verified land parcels with ownership verification.
            </p>
            <p className="text-sm text-neutral-500">
              Starting in Sierra Leone. Expanding across West Africa.
            </p>
          </div>

          {/* Smart Search Bar */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-white rounded-2xl shadow-elevation p-1 border border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
                {/* District/Chiefdom */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    District / Chiefdom
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Western Area"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>

                {/* Land Type */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Land Type
                  </label>
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="agricultural">Agricultural</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  >
                    <option value="">Select purpose</option>
                    <option value="build">Build Home</option>
                    <option value="invest">Invest</option>
                    <option value="farm">Farm</option>
                    <option value="develop">Develop</option>
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Budget (USD)
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  >
                    <option value="">Any price</option>
                    <option value="0-5000">Under $5K</option>
                    <option value="5000-25000">$5K - $25K</option>
                    <option value="25000-100000">$25K - $100K</option>
                    <option value="100000+">$100K+</option>
                  </select>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={handleSearch}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft"
                >
                  Search Land
                </button>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="max-w-5xl mx-auto">
            <p className="text-xs text-neutral-600 text-center mb-6 font-semibold uppercase tracking-wide">
              Every land is verified for:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-neutral-200 text-center shadow-soft hover:shadow-elevation transition-shadow">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 text-sm mb-1">
                  Verified Survey Plan
                </h4>
                <p className="text-xs text-neutral-600">Confirmed by experts</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-neutral-200 text-center shadow-soft hover:shadow-elevation transition-shadow">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 text-sm mb-1">
                  Community Confirmed
                </h4>
                <p className="text-xs text-neutral-600">Local validation</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-neutral-200 text-center shadow-soft hover:shadow-elevation transition-shadow">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 text-sm mb-1">
                  Ownership Disclosed
                </h4>
                <p className="text-xs text-neutral-600">Family history clear</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-neutral-200 text-center shadow-soft hover:shadow-elevation transition-shadow">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary-50 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-neutral-900 text-sm mb-1">
                  No Disputes
                </h4>
                <p className="text-xs text-neutral-600">Court-conflict free</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 py-16 bg-white border-t border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Ready to verify land?
            </h2>
            <p className="text-neutral-600 mb-8">
              Upload documents and get instant verification results with confidence scores.
            </p>
            <Link
              to="/verify"
              className="inline-block px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft"
            >
              Start Verification
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
