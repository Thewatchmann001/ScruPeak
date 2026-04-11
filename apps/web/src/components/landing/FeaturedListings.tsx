"use client";

import { useEffect, useState } from "react";
import { ZillowCard } from "./ZillowCard";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function FeaturedListings() {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get<any>("/api/v1/land?page_size=6");
        const items = response.data.items || [];
        setFeaturedProperties(items);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text mb-2">Hot Properties</h2>
            <p className="text-text-secondary">Discover our most trusted land listings.</p>
          </div>
          <Link to="/marketplace" className="text-primary font-bold hover:underline">
            View all listings
          </Link>
        </div>

        {featuredProperties.length === 0 ? (
          <div className="bg-surface rounded-xl p-12 text-center border border-border">
            <p className="text-text-muted">No listings available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <ZillowCard key={property.id} listing={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
