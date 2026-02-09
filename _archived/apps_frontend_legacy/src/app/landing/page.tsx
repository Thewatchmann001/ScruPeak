"use client";

import { ZillowHero } from "@/components/landing/ZillowHero";
import { FeaturedListings } from "@/components/landing/FeaturedListings";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { MarketInsights } from "@/components/landing/MarketInsights";
import { PremiumCTA } from "@/components/landing/PremiumCTA";
import { PremiumFooter } from "@/components/landing/PremiumFooter";

export default function LandingPage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <ZillowHero />

      {/* Featured Listings */}
      <FeaturedListings />

      {/* Trust Strip */}
      <section className="bg-gradient-to-r from-gray-900 to-black py-12">
        <TrustStrip />
      </section>

      {/* Market Insights */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-orange-600 rounded-full" />
              <span className="text-orange-600 font-bold text-sm uppercase tracking-widest">Market Data</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">Market Intelligence</h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Real-time analytics, price trends, and risk assessment powered by community verification.
            </p>
          </div>
          <MarketInsights />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <PremiumCTA />
        </div>
      </section>

      {/* Footer */}
      <PremiumFooter />
    </main>
  );
}
