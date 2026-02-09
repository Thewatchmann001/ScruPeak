"use client";

import { useState, useEffect } from "react";
import { Land } from "@/types";
import { api } from "@/services/api";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatArea, getStatusColor } from "@/utils/formatters";
import { toast } from "sonner";
import Link from "next/link";

export default function LandListingsPage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    setLoading(true);
    try {
      const response = await api.get<Land[]>("/land/listings");
      setLands(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load land listings");
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const filteredLands = lands.filter((land) => {
    const matchesSearch =
      land.title.toLowerCase().includes(search.toLowerCase()) ||
      land.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || land.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <Container className="py-12">
      <PageHeader
        title="Available Land"
        description="Browse available properties and find your perfect plot"
        action={
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
              size="sm"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              List
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Input
          placeholder="Search by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          {error}
          <Button variant="outline" size="sm" onClick={fetchLands} className="mt-2">
            Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredLands.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">No land listings found</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {filteredLands.map((land) => (
            <Link key={land.id} href={`/land/${land.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex-1 line-clamp-2">
                      {land.title}
                    </h3>
                    <Badge
                      variant={getStatusColor(land.status) as any}
                    >
                      {land.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {land.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Size</span>
                      <span className="font-semibold text-slate-900">
                        {formatArea(land.size_sqm)}
                      </span>
                    </div>
                    {land.price && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Price</span>
                        <span className="font-semibold text-primary-600">
                          {formatCurrency(land.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {land.documents.length} documents
                    </span>
                    <Button size="sm" variant="ghost">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-slate-600 mb-4">
          Showing {filteredLands.length} of {lands.length} properties
        </p>
      </div>
    </Container>
  );
}
