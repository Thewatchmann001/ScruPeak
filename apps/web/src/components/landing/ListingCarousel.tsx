"use client";

import { useState } from "react";

interface Listing {
  id: string;
  location: string;
  size: number;
  sizeUnit: string;
  purpose: string;
  price: number;
  verification: number;
  image: string;
}

interface ListingCarouselProps {
  title?: string;
  listings: Listing[];
}

export function ListingCarousel({ title, listings }: ListingCarouselProps) {
  // const [scrollPosition, setScrollPosition] = useState(0);

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-black text-gray-900 mb-2">
          Featured <span className="text-orange-500">Listings</span>
        </h2>
        <p className="text-gray-600 mb-12">Explore verified land from across Sierra Leone</p>

        {/* Carousel */}
        <div className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
          <div className="flex gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex-shrink-0 w-80 bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-2"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.location}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {listing.verification}% Verified
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    {listing.location}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {listing.size} {listing.sizeUnit} • {listing.purpose}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-gray-200">
                    <span className="text-2xl font-black text-orange-500">
                      ${listing.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Verification Bar */}
                  <div className="mb-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${listing.verification}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      ✓ Survey Verified • ✓ Community Confirmed
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 text-sm font-bold border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-all">
                      View
                    </button>
                    <button className="flex-1 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all">
                      Inquire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
