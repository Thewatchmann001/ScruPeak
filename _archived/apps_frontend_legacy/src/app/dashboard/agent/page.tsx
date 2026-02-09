"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  TrendingUp,
  Home,
  Check,
  Clock,
  Eye,
  Heart,
  DollarSign,
  Calendar,
  ArrowRight,
  Upload,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const agentStats = {
  totalListings: 24,
  landsInactive: 12,
  landsSold: 5,
  activeListings: 7,
  totalViews: 1243,
  totalInterested: 89,
  totalRevenue: "₦2.1M",
};

const agentListings = [
  {
    id: 1,
    title: "Prime Freetown Plot",
    location: "Aberdeen, Freetown, Western Area Urban",
    price: 45000,
    area: 500,
    dimensions: "25m x 20m",
    views: 234,
    interested: 12,
    listedDate: "January 15, 2026",
    status: "active",
    image: "🏘️",
    featured: true,
    type: "Residential",
  },
  {
    id: 2,
    title: "Commercial Plot - East Freetown",
    location: "Kissy, Freetown",
    price: 65000,
    area: 800,
    dimensions: "32m x 25m",
    views: 189,
    interested: 8,
    listedDate: "January 10, 2026",
    status: "active",
    image: "🏢",
    featured: false,
    type: "Commercial",
  },
  {
    id: 3,
    title: "Residential Corner Plot",
    location: "Wilkinson Road, Freetown",
    price: 35000,
    area: 350,
    dimensions: "20m x 17.5m",
    views: 156,
    interested: 6,
    listedDate: "January 8, 2026",
    status: "sold",
    image: "🏡",
    featured: false,
    type: "Residential",
  },
];

const landHistory = [
  {
    id: 1,
    title: "Prime Freetown Plot",
    previousOwner: "John Smith",
    soldDate: "December 2025",
    price: "₦40,000",
  },
  {
    id: 2,
    title: "Premium Commercial Site",
    previousOwner: "ABC Real Estate",
    soldDate: "November 2025",
    price: "₦60,000",
  },
];

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Agent Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Track your listings, sales, and performance
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/agent/upload">
                <Button className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  List New Land
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-start justify-between mb-3">
              <Home className="w-5 h-5 text-blue-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Listings</p>
            <p className="text-3xl font-bold">{agentStats.totalListings}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-start justify-between mb-3">
              <Check className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Lands Sold</p>
            <p className="text-3xl font-bold">{agentStats.landsSold}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <div className="flex items-start justify-between mb-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Active Listings</p>
            <p className="text-3xl font-bold">{agentStats.activeListings}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-start justify-between mb-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold">{agentStats.totalRevenue}</p>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Total Views</p>
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{agentStats.totalViews}</p>
            <p className="text-xs text-muted-foreground mt-2">Across all listings</p>
          </Card>

          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Total Interested</p>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold">{agentStats.totalInterested}</p>
            <p className="text-xs text-muted-foreground mt-2">Potential buyers</p>
          </Card>

          <Card className="p-6 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">Average Views/Land</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {Math.round(agentStats.totalViews / agentStats.totalListings)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Per listing</p>
          </Card>
        </div>

        {/* Listings Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background">
              Active Listings ({agentStats.activeListings})
            </TabsTrigger>
            <TabsTrigger value="sold" className="rounded-lg data-[state=active]:bg-background">
              Sold Lands ({agentStats.landsSold})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg data-[state=active]:bg-background">
              Inactive ({agentStats.landsInactive})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background">
              History
            </TabsTrigger>
          </TabsList>

          {/* Active Listings Tab */}
          <TabsContent value="active" className="space-y-4">
            {agentListings
              .filter((l) => l.status === "active")
              .map((listing) => (
                <AgentListingCard key={listing.id} listing={listing} />
              ))}
          </TabsContent>

          {/* Sold Tab */}
          <TabsContent value="sold" className="space-y-4">
            {agentListings
              .filter((l) => l.status === "sold")
              .map((listing) => (
                <SoldListingCard key={listing.id} listing={listing} />
              ))}
          </TabsContent>

          {/* Inactive Tab */}
          <TabsContent value="inactive" className="space-y-4">
            <Card className="p-8 text-center bg-muted/50 border border-dashed">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {agentStats.landsInactive} inactive listings (hidden from marketplace)
              </p>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {landHistory.map((item) => (
                <Card key={item.id} className="p-4 border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Previously owned by {item.previousOwner}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sold {item.soldDate} • {item.price}
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Sold</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AgentListingCard({ listing }: { listing: any }) {
  return (
    <Link href={`/land/${listing.id}`}>
      <Card className="p-4 border border-border hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
            {listing.image}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                {listing.featured && (
                  <Badge className="mb-2 bg-yellow-500/10 text-yellow-500">
                    Featured
                  </Badge>
                )}
                <h4 className="font-semibold text-lg">{listing.title}</h4>
                <p className="text-xs text-muted-foreground">{listing.location}</p>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Active</Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Price</p>
                <p className="font-bold">₦{listing.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Area</p>
                <p className="font-bold">{listing.area} sqm</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Views</p>
                <p className="font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {listing.views}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Interested</p>
                <p className="font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {listing.interested}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Listed {listing.listedDate}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary hover:bg-primary/10"
              >
                View Details
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function SoldListingCard({ listing }: { listing: any }) {
  return (
    <Card className="p-4 border border-green-500/20 bg-green-500/5">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center text-4xl flex-shrink-0 opacity-60">
          {listing.image}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-lg">{listing.title}</h4>
              <p className="text-xs text-muted-foreground">{listing.location}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-500">✓ Sold</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Sold Price</p>
              <p className="font-bold">₦{listing.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Area</p>
              <p className="font-bold">{listing.area} sqm</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Interest</p>
              <p className="font-bold">{listing.interested} people</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
