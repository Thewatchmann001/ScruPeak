"use client";

import { useState } from "react";

interface Listing {
  id: string;
  location: string;
  size: number;
  price: number;
  verificationScore: number;
  views: number;
  inquiries: number;
  status: "active" | "pending" | "sold";
  postedDate: string;
}

export function SellerDashboard() {
  const [listings, setListings] = useState<Listing[]>([
    {
      id: "1",
      location: "Freetown, Western Area",
      size: 2500,
      price: 45000,
      verificationScore: 92,
      views: 234,
      inquiries: 18,
      status: "active",
      postedDate: "2024-01-15",
    },
    {
      id: "2",
      location: "Bo, Southern Region",
      size: 3200,
      price: 28000,
      verificationScore: 78,
      views: 156,
      inquiries: 12,
      status: "pending",
      postedDate: "2024-01-10",
    },
    {
      id: "3",
      location: "Kenema, Eastern Region",
      size: 1800,
      price: 32000,
      verificationScore: 85,
      views: 89,
      inquiries: 5,
      status: "sold",
      postedDate: "2023-12-20",
    },
  ]);

  const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
  const totalInquiries = listings.reduce((sum, l) => sum + l.inquiries, 0);
  const avgVerification =
    Math.round(
      listings.reduce((sum, l) => sum + l.verificationScore, 0) / listings.length
    ) || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-b border-neutral-200 bg-white">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Seller Dashboard
        </h1>
        <p className="text-lg text-neutral-600">
          Manage your listings and track buyer interest
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Active Listings
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {listings.filter((l) => l.status === "active").length}
            </p>
            <p className="text-xs text-neutral-600 mt-2">
              {listings.filter((l) => l.status === "sold").length} sold this year
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Total Views
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-2">↑ 24% this month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Total Inquiries
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {totalInquiries}
            </p>
            <p className="text-xs text-neutral-600 mt-2">
              {Math.round((totalInquiries / totalViews) * 100)}% conversion rate
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
            <p className="text-sm text-neutral-600 mb-2 font-semibold uppercase">
              Avg Verification
            </p>
            <p className="text-3xl font-bold text-neutral-900">
              {avgVerification}%
            </p>
            <p className="text-xs text-green-600 mt-2">High trust score</p>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Your Listings</h2>
            <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
              New Listing
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Size
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Verification
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Views
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Inquiries
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {listing.location}
                        </p>
                        <p className="text-xs text-neutral-600">
                          Posted {listing.postedDate}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-900">
                        {listing.size.toLocaleString()} sqm
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-neutral-900">
                        ${listing.price.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600"
                            style={{
                              width: `${listing.verificationScore}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-neutral-900">
                          {listing.verificationScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-neutral-900">
                        {listing.views}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-neutral-900">
                        {listing.inquiries}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          listing.status === "active"
                            ? "bg-green-50 text-green-700"
                            : listing.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {listing.status.charAt(0).toUpperCase() +
                          listing.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-soft p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">
            Recent Inquiries
          </h2>
          <div className="space-y-4">
            {[
              {
                buyer: "Amara Johnson",
                listing: "Freetown, Western Area",
                message: "Interested in buying. Can we schedule a viewing?",
                date: "2 hours ago",
              },
              {
                buyer: "Mohamed Hassan",
                listing: "Bo, Southern Region",
                message: "What's the lowest price you can go?",
                date: "5 hours ago",
              },
              {
                buyer: "Zainab Koroma",
                listing: "Freetown, Western Area",
                message: "Does the land have water access?",
                date: "1 day ago",
              },
            ].map((inquiry, idx) => (
              <div
                key={idx}
                className="pb-4 border-b border-neutral-100 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {inquiry.buyer}
                    </p>
                    <p className="text-sm text-neutral-600">
                      About: {inquiry.listing}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600">{inquiry.date}</p>
                </div>
                <p className="text-sm text-neutral-700 mb-3">{inquiry.message}</p>
                <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                  Reply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
