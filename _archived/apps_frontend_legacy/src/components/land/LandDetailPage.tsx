"use client";

import { useState } from "react";
import Link from "next/link";
import { VerificationBadge, VerificationIndicator } from "@/components/verification/VerificationUI";

interface LandDetailProps {
  id: string;
  location: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
  };
  size: number;
  sizeUnit: "sqm" | "acres";
  purpose: string;
  price: number;
  verificationScore: number;
  ownership: {
    familyName: string;
    yearsHeld: number;
    dispute: boolean;
  };
  documents: Array<{
    type: string;
    status: "verified" | "pending" | "flagged";
    date: string;
  }>;
  risks: string[];
  mapImage?: string;
}

export function LandDetailPage({
  id,
  location,
  size,
  sizeUnit,
  purpose,
  price,
  verificationScore,
  ownership,
  documents,
  risks,
  mapImage,
}: LandDetailProps) {
  const [selectedTab, setSelectedTab] = useState<"overview" | "documents" | "intelligence">("overview");
  const riskLevel = verificationScore >= 80 ? "low" : verificationScore >= 50 ? "medium" : "high";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back Button */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/explore"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Explore
          </Link>
        </div>
      </div>
      {/* Map Section */}
      {mapImage && (
        <div className="h-96 bg-neutral-200 relative overflow-hidden">
          <img
            src={mapImage}
            alt="Land map"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg shadow-soft text-sm font-medium hover:bg-neutral-50">
              Satellite
            </button>
            <button className="px-4 py-2 bg-white rounded-lg shadow-soft text-sm font-medium hover:bg-neutral-50">
              Terrain
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-2">
                  {location.country} • {location.district} • {location.chiefdom}
                </p>
                <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                  {location.community}
                </h1>
                <p className="text-lg text-neutral-600">
                  {size.toLocaleString()} {sizeUnit} • {purpose}
                </p>
              </div>
            </div>

            {/* Key Facts */}
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Key Facts
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">Price</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Size
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {size.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-600">{sizeUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Price / {sizeUnit}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${Math.round(price / size)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Purpose
                  </p>
                  <p className="text-lg font-bold text-primary-600 capitalize">
                    {purpose}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200">
              <div className="flex gap-8">
                {["overview", "documents", "intelligence"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setSelectedTab(
                        tab as "overview" | "documents" | "intelligence"
                      )
                    }
                    className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                      selectedTab === tab
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Ownership Info */}
                <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                  <h4 className="font-semibold text-neutral-900 mb-4">
                    Ownership Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Family Name:</span>
                      <span className="font-medium text-neutral-900">
                        {ownership.familyName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Years Held:</span>
                      <span className="font-medium text-neutral-900">
                        {ownership.yearsHeld} years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Court Dispute:</span>
                      <span
                        className={`font-medium ${
                          ownership.dispute
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {ownership.dispute ? "Flagged" : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risks */}
                {risks.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                    <h4 className="font-semibold text-neutral-900 mb-4">
                      Risk Indicators
                    </h4>
                    <div className="space-y-2">
                      {risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0v-2"
                            />
                          </svg>
                          <span className="text-sm text-neutral-700">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "documents" && (
              <div className="space-y-4">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-neutral-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-semibold text-neutral-900">
                          {doc.type}
                        </h5>
                        <p className="text-sm text-neutral-600">{doc.date}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === "verified"
                          ? "bg-green-50 text-green-700"
                          : doc.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "intelligence" && (
              <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                <h4 className="font-semibold text-neutral-900 mb-4">
                  Land Intelligence
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Development Corridor:</span>
                    <span className="font-medium">Primary Growth Zone</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Accessibility:</span>
                    <span className="font-medium">High (Paved Road)</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Infrastructure:</span>
                    <span className="font-medium">Water & Power Nearby</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700">Flood Risk:</span>
                    <span className="font-medium text-green-600">Low</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Score */}
            <VerificationIndicator score={verificationScore} risk={riskLevel} />

            {/* Verification Details */}
            <div className="space-y-3">
              <VerificationBadge
                status="verified"
                label="Survey Plan Verified"
                description="Confirmed by licensed surveyor"
              />
              <VerificationBadge
                status="verified"
                label="Community Confirmed"
                description="Local stakeholders validated"
              />
              <VerificationBadge
                status={ownership.dispute ? "flag" : "verified"}
                label={ownership.dispute ? "Court Dispute Detected" : "No Disputes"}
                description={ownership.dispute ? "Pending investigation" : "Clear court history"}
              />
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft">
                Make Inquiry
              </button>
              <button className="w-full py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors">
                Save to List
              </button>
            </div>

            {/* Contact Seller */}
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
              <h4 className="font-semibold text-neutral-900 mb-4">Contact Seller</h4>
              <button className="w-full py-2 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
