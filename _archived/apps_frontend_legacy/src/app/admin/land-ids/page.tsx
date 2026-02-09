"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  AlertCircle,
  MapPin,
  FileCheck,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const generatedLandIDs = [
  {
    landID: "LAND-SL-2025-00001",
    ownerName: "John Doe",
    address: "123 Main Street, Freetown",
    coordinates: "8.4657, -13.2317",
    documentType: "survey-document",
    verifiedDate: "2025-01-24",
    status: "active",
  },
  {
    landID: "LAND-SL-2025-00002",
    ownerName: "Jane Smith",
    address: "456 Oak Avenue, Kingtom",
    coordinates: "8.4658, -13.2318",
    documentType: "chief-approval",
    verifiedDate: "2025-01-24",
    status: "active",
  },
  {
    landID: "LAND-SL-2025-00003",
    ownerName: "Ibrahim Hassan",
    address: "789 Pine Road, Bo",
    coordinates: "7.9465, -11.7679",
    documentType: "oarg-document",
    verifiedDate: "2025-01-23",
    status: "active",
  },
];

export default function LandIDGeneratorPage() {
  const [copiedID, setCopiedID] = useState<string | null>(null);

  const handleCopy = (landID: string) => {
    navigator.clipboard.writeText(landID);
    setCopiedID(landID);
    setTimeout(() => setCopiedID(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Land ID Generator</h1>
          <p className="text-muted-foreground mt-1">
            Automatic unique ID generation for verified land parcels
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Total Generated</p>
            </div>
            <p className="text-3xl font-bold">{generatedLandIDs.length}</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Active Land IDs</p>
            </div>
            <p className="text-3xl font-bold">
              {generatedLandIDs.filter((l) => l.status === "active").length}
            </p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-medium text-muted-foreground">Today Generated</p>
            </div>
            <p className="text-3xl font-bold">
              {
                generatedLandIDs.filter(
                  (l) => l.verifiedDate === "2025-01-24"
                ).length
              }
            </p>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="p-6 bg-muted/50 border border-border rounded-2xl">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            How Automatic Land ID Generation Works
          </h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Document Verified</p>
                <p className="text-sm text-muted-foreground">
                  Admin verifies a land document (survey, chief approval, registration, or agreement)
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">AI Data Extraction</p>
                <p className="text-sm text-muted-foreground">
                  AI scans document and extracts owner name, address, coordinates, and previous owner
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Unique ID Generation</p>
                <p className="text-sm text-muted-foreground">
                  System automatically generates unique Land ID in format: LAND-SL-YYYY-XXXXX
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <p className="font-medium">Database Entry</p>
                <p className="text-sm text-muted-foreground">
                  Land record automatically added to system with all extracted data and generated ID
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Generated Land IDs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background">
              All Generated IDs
            </TabsTrigger>
            <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-background">
              Generated Today
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background">
              Pending Activation
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4">
            {generatedLandIDs.map((land) => (
              <LandIDCard
                key={land.landID}
                land={land}
                onCopy={() => handleCopy(land.landID)}
                copied={copiedID === land.landID}
              />
            ))}
          </TabsContent>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-4">
            {generatedLandIDs
              .filter((l) => l.verifiedDate === "2025-01-24")
              .map((land) => (
                <LandIDCard
                  key={land.landID}
                  land={land}
                  onCopy={() => handleCopy(land.landID)}
                  copied={copiedID === land.landID}
                />
              ))}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card className="p-8 text-center bg-muted/50 border border-dashed">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No pending IDs for activation</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function LandIDCard({
  land,
  onCopy,
  copied,
}: {
  land: any;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-primary/10">
              <p className="font-mono font-bold text-primary text-sm">
                {land.landID}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCopy}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {copied ? "Copied to clipboard!" : "Click to copy ID"}
          </p>
        </div>
        <Badge className="bg-green-500/10 text-green-500">
          {land.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Owner & Address Info */}
      <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Owner Name</p>
          <p className="font-medium">{land.ownerName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Land Address</p>
          <p className="font-medium text-sm">{land.address}</p>
        </div>
      </div>

      {/* Coordinates & Metadata */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Coordinates</p>
            <p className="font-mono text-sm">{land.coordinates}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Document Type</p>
          <Badge className="bg-blue-500/10 text-blue-500 capitalize">
            {land.documentType.replace("-", " ")}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Generated</p>
          <p className="font-medium text-sm">{land.verifiedDate}</p>
        </div>
      </div>
    </Card>
  );
}
