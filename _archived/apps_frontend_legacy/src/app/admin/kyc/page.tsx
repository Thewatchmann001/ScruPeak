"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  FileText,
  MapPin,
  User,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const kycApplications = [
  {
    id: 1,
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    phone: "+232 78 123 456",
    address: "123 Main Street, Freetown",
    city: "Freetown",
    state: "Western Area",
    idType: "passport",
    idNumber: "SL123456",
    submittedDate: "2 hours ago",
    status: "pending",
    documents: {
      idDocument: "passport-scan.pdf",
      proofOfResidence: "utility-bill.pdf",
    },
    riskScore: 5,
    notes: "Clean background, all documents verified",
  },
  {
    id: 2,
    name: "Fatima Conteh",
    email: "fatima@example.com",
    phone: "+232 76 789 012",
    address: "456 Oak Avenue, Kingtom",
    city: "Kingtom",
    state: "Western Area",
    idType: "national-id",
    idNumber: "NID987654",
    submittedDate: "5 hours ago",
    status: "pending",
    documents: {
      idDocument: "national-id.pdf",
      proofOfResidence: "bank-statement.pdf",
    },
    riskScore: 3,
    notes: "Standard verification",
  },
  {
    id: 3,
    name: "Mohamed Kamara",
    email: "mohamed@example.com",
    phone: "+232 72 345 678",
    address: "789 Pine Road, Bo",
    city: "Bo",
    state: "Bo District",
    idType: "driver-license",
    idNumber: "DL456789",
    submittedDate: "1 day ago",
    status: "approved",
    documents: {
      idDocument: "driver-license.pdf",
      proofOfResidence: "rental-agreement.pdf",
    },
    riskScore: 2,
    notes: "All documents verified, account approved",
  },
];

export default function KYCVerificationPage() {
  const [applications, setApplications] = useState(kycApplications);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);

  const handleApprove = (id: number) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, status: "approved" } : app
      )
    );
    setSelectedApp(null);
  };

  const handleReject = (id: number) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, status: "rejected" } : app
      )
    );
    setSelectedApp(null);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground mt-1">
            Verify land owner and agent identities
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background">
              Pending ({applications.filter((a) => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-background">
              Approved ({applications.filter((a) => a.status === "approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-background">
              Rejected ({applications.filter((a) => a.status === "rejected").length})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background">
              All ({applications.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {applications
              .filter((app) => app.status === "pending")
              .map((app) => (
                <KYCApplicationCard
                  key={app.id}
                  app={app}
                  onApprove={() => handleApprove(app.id)}
                  onReject={() => handleReject(app.id)}
                  onViewDetails={() => setSelectedApp(app.id)}
                />
              ))}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {applications
              .filter((app) => app.status === "approved")
              .map((app) => (
                <KYCApprovedCard key={app.id} app={app} />
              ))}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {applications
              .filter((app) => app.status === "rejected")
              .map((app) => (
                <KYCRejectedCard key={app.id} app={app} />
              ))}
          </TabsContent>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4">
            {applications.map((app) => (
              <div key={app.id}>
                {app.status === "pending" && (
                  <KYCApplicationCard
                    app={app}
                    onApprove={() => handleApprove(app.id)}
                    onReject={() => handleReject(app.id)}
                    onViewDetails={() => setSelectedApp(app.id)}
                  />
                )}
                {app.status === "approved" && <KYCApprovedCard app={app} />}
                {app.status === "rejected" && <KYCRejectedCard app={app} />}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-96 overflow-y-auto p-6">
              {(() => {
                const app = applications.find((a) => a.id === selectedApp);
                if (!app) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold">{app.name}</h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedApp(null)}
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{app.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{app.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{app.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          City/District
                        </p>
                        <p className="font-medium">
                          {app.city}, {app.state}
                        </p>
                      </div>
                    </div>

                    <div className="pb-4 border-b border-border">
                      <h3 className="font-semibold mb-3">Documents</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">
                            {app.documents.idDocument}
                          </span>
                          <Badge className="ml-auto bg-green-500/10 text-green-500">
                            ✓
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">
                            {app.documents.proofOfResidence}
                          </span>
                          <Badge className="ml-auto bg-green-500/10 text-green-500">
                            ✓
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="pb-4 border-b border-border">
                      <h3 className="font-semibold mb-2">Risk Assessment</h3>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Risk Score
                          </p>
                          <p className="text-2xl font-bold text-green-500">
                            {app.riskScore}/10
                          </p>
                        </div>
                        <div className="flex-1 bg-muted rounded p-2">
                          <p className="text-sm text-muted-foreground">
                            {app.notes}
                          </p>
                        </div>
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            handleApprove(app.id);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve KYC
                        </Button>
                        <Button
                          onClick={() => {
                            handleReject(app.id);
                          }}
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function KYCApplicationCard({
  app,
  onApprove,
  onReject,
  onViewDetails,
}: {
  app: any;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
}) {
  return (
    <Card className="p-6 border border-border rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{app.name}</h3>
              <p className="text-sm text-muted-foreground">
                Submitted {app.submittedDate}
              </p>
            </div>
          </div>
        </div>
        <Badge className="bg-yellow-500/10 text-yellow-500">
          Pending Review
        </Badge>
      </div>

      {/* Info Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{app.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{app.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {app.city}, {app.state}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {app.idType}: {app.idNumber}
          </span>
        </div>
      </div>

      {/* Risk Score */}
      <div className="mb-6 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="font-medium">Risk Assessment</span>
          <Badge
            className={`${
              app.riskScore <= 3
                ? "bg-green-500/10 text-green-500"
                : app.riskScore <= 6
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-red-500/10 text-red-500"
            }`}
          >
            {app.riskScore}/10 - {app.notes}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onApprove}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button onClick={onReject} variant="destructive" className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button onClick={onViewDetails} variant="outline" className="flex-1">
          View Details
        </Button>
      </div>
    </Card>
  );
}

function KYCApprovedCard({ app }: { app: any }) {
  return (
    <Card className="p-6 border border-green-500/20 bg-green-500/5 rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{app.name}</h3>
              <p className="text-sm text-muted-foreground">{app.email}</p>
            </div>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-500">✓ Approved</Badge>
      </div>
    </Card>
  );
}

function KYCRejectedCard({ app }: { app: any }) {
  return (
    <Card className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{app.name}</h3>
              <p className="text-sm text-muted-foreground">{app.email}</p>
            </div>
          </div>
        </div>
        <Badge className="bg-red-500/10 text-red-500">✕ Rejected</Badge>
      </div>
    </Card>
  );
}
