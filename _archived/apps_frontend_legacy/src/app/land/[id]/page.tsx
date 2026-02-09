"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveMap } from "@/components/map/InteractiveMap";

// Sample land data
const landData = {
  id: 1,
  title: "Prime Freetown Plot",
  type: "Residential",
  featured: true,
  location: "Aberdeen, Freetown, Western Area Urban",
  price: 45000,
  area: 500,
  dimensions: "25m x 20m",
  views: 234,
  interested: 12,
  listedDate: "January 15, 2026",
  image: "🏘️",
  description: `This prime plot of land is located in the heart of Aberdeen, one of Freetown's most desirable neighborhoods. The property offers excellent potential for residential development with stunning views of the Atlantic Ocean.

The land has clear documentation including survey plans certified by the Ministry of Lands and a chief's form confirming traditional ownership rights. All documents have been verified through our AI-powered verification system and approved by our admin team.

The area is well-developed with access to electricity, water, and good road networks. Nearby amenities include schools, hospitals, shopping centers, and restaurants.`,
  features: [
    "Ocean views",
    "Electricity access",
    "Water supply",
    "Paved road access",
    "Close to schools",
    "Near hospital",
    "Shopping nearby",
    "Flat terrain",
  ],
  owner: {
    name: "Mohamed Kamara",
    role: "owner",
    listings: 5,
    transactions: 12,
    phone: "+232 78 123 456",
    email: "mohamed@example.com",
  },
  history: [
    {
      id: 1,
      title: "Prime Freetown Plot",
      previousOwner: "John Smith",
      soldDate: "December 2024",
      price: "₦40,000",
    },
    {
      id: 2,
      title: "Same Location - Extended Plot",
      previousOwner: "ABC Real Estate",
      soldDate: "June 2024",
      price: "₦35,000",
    },
    {
      id: 3,
      title: "Adjacent Plot - Previously Combined",
      previousOwner: "Community Chief",
      soldDate: "March 2024",
      price: "₦32,000",
    },
  ],
};

export default function LandDetailsPage({ params }: { params: { id: string } }) {
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Featured Badge */}
            <div className="space-y-4">
              {landData.featured && (
                <Badge className="bg-yellow-500/10 text-yellow-500 w-fit">
                  ⭐ Featured
                </Badge>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-blue-500/10 text-blue-500">
                      {landData.type}
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold">{landData.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                    <MapPin className="w-5 h-5" />
                    <span>{landData.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setLiked(!liked)}
                  >
                    <Heart
                      className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Large Image */}
            <Card className="p-12 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-8xl mb-4">{landData.image}</div>
                <p className="text-muted-foreground">Land Image/Gallery</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload property images for better visibility
                </p>
              </div>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Price</p>
                <p className="text-2xl font-bold">₦{landData.price.toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Area</p>
                <p className="text-2xl font-bold">{landData.area} sqm</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                <p className="text-2xl font-bold">{landData.dimensions}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Listed</p>
                <p className="text-2xl font-bold font-mono text-xs">
                  {landData.listedDate.split(" ")[0]}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="text-muted-foreground text-sm">Views</span>
                </div>
                <p className="text-2xl font-bold">{landData.views}</p>
              </Card>
              <Card className="p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-muted-foreground text-sm">Interested</span>
                </div>
                <p className="text-2xl font-bold">{landData.interested}</p>
              </Card>
              <Card className="p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span className="text-muted-foreground text-sm">Listed Date</span>
                </div>
                <p className="text-2xl font-bold font-mono text-sm">
                  Jan 15
                </p>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background">
                  History
                </TabsTrigger>
                <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-background">
                  AI Insights
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Description</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {landData.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Features</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {landData.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Location</h2>
                  <Card className="p-0 overflow-hidden border border-border rounded-lg">
                    <InteractiveMap
                      listings={[
                        {
                          id: landData.id.toString(),
                          location: {
                            country: "Sierra Leone",
                            community: landData.location.split(",")[0] || "Freetown",
                            chiefdom: landData.location.split(",")[1] || "Western Urban",
                            district: landData.location.split(",")[2] || "Western Area",
                            coordinates: [8.4840, -13.2299] as [number, number], // Default Freetown, should come from backend
                          },
                          price: landData.price,
                          size: landData.area,
                          sizeUnit: "sqm" as const,
                          purpose: landData.type,
                          verificationScore: 95, // Should come from backend
                        },
                      ]}
                      selectedListingId={landData.id.toString()}
                      height="400px"
                      showControls={true}
                    />
                    <div className="p-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {landData.location}
                      </p>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold mb-4">Land History</h2>
                  {landData.history.map((item, idx) => (
                    <Card key={item.id} className="p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Previous Owner: {item.previousOwner}
                          </p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500">
                          {item.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Sold {item.soldDate}
                      </p>
                    </Card>
                  ))}
                </div>

                <Card className="p-4 bg-blue-500/5 border border-blue-500/20">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Clear Title History</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This land shows 3 previous transactions with no disputed ownership or legal issues.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <div className="space-y-4">
                  <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3 mb-4">
                      <Zap className="w-5 h-5 text-primary mt-0.5" />
                      <h3 className="font-semibold">AI Document Analysis</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Survey plans verified by Ministry of Lands</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Chief approval form confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Land ID generated: LAND-SL-2025-00001</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>No ownership disputes detected</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                    <h3 className="font-semibold mb-4">Market Analysis</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Average price for similar properties</p>
                        <p className="font-bold">₦42,000 - ₦48,000</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">This listing</p>
                        <p className="font-bold text-green-500">₦45,000 (Fair market value)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area demand</p>
                        <p className="font-bold">High interest (12 people interested)</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                    <h3 className="font-semibold mb-4">Recommendation</h3>
                    <p className="text-sm text-muted-foreground">
                      This is a premium property with strong fundamentals. The location has good amenities, 
                      clear title history, and verified documents. The price is competitive for the area. 
                      High interest level suggests good market demand.
                    </p>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            <Card className="p-6 border border-border sticky top-32">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="font-bold text-lg">{landData.owner.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {landData.owner.role}
                </p>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Listings</p>
                  <p className="text-2xl font-bold">{landData.owner.listings}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{landData.owner.transactions}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  {landData.owner.phone}
                </Button>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Buy Land
                </Button>
              </div>
            </Card>

            {/* Security Notice */}
            <Card className="p-4 bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Security Notice</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Never complete transactions outside LandBiznes. Always use our secure escrow system for protection.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
                <div>
                  <p className="text-sm text-slate-600 mb-1">Listed</p>
                  <p className="text-sm text-slate-900">{formatDate(land.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({land.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {land.documents.length === 0 ? (
                <p className="text-slate-600 text-center py-6">No documents uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {land.documents.map((doc: Document) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {doc.document_type}
                        </p>
                        <p className="text-sm text-slate-600">
                          Uploaded {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.ai_fraud_score && (
                          <Badge
                            variant={doc.ai_fraud_score < 0.5 ? "success" : "warning"}
                          >
                            Fraud: {(doc.ai_fraud_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-bold text-primary-600">
                      {land.owner_id.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Owner ID</p>
                    <p className="text-sm text-slate-600 font-mono">
                      {land.owner_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <Button className="w-full">Contact Owner</Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {land.status === "available" && user && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button className="w-full">Make an Offer</Button>
                <Button variant="outline" className="w-full">Message Owner</Button>
                <Button variant="ghost" className="w-full">Save to Wishlist</Button>
              </CardContent>
            </Card>
          )}

          {/* Blockchain Info */}
          {land.blockchain_hash && (
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-3">
                  This land has been verified and recorded on the Solana blockchain.
                </p>
                <code className="text-xs bg-slate-100 p-2 rounded block break-all text-slate-700">
                  {land.blockchain_hash.slice(0, 32)}...
                </code>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View on Solana Explorer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
