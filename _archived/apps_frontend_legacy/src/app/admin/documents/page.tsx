"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const documentTypes = [
  { id: "buyer-seller-agreement", label: "Buyer-Seller Agreement", description: "Agreement between buyer and seller" },
  { id: "chief-approval", label: "Chief Approval", description: "Community chief's approval document" },
  { id: "survey-document", label: "Survey Document", description: "Land survey and measurements" },
  { id: "oarg-document", label: "OARG Document", description: "Official property registration" },
];

const sampleDocuments = [
  {
    id: "DOC-001",
    title: "Prime Freetown Plot - Buyer-Seller Agreement",
    type: "buyer-seller-agreement",
    uploadedBy: "Mohamed Kamara",
    uploadDate: "2 hours ago",
    status: "pending",
    land: "Prime Freetown Plot",
    extractedData: null,
  },
  {
    id: "DOC-002",
    title: "Bo District Land - Chief Approval",
    type: "chief-approval",
    uploadedBy: "Fatmata Sesay",
    uploadDate: "4 hours ago",
    status: "pending",
    land: "Bo District Land",
    extractedData: null,
  },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(sampleDocuments);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadedFile || !selectedDocType) {
      alert("Please select a document type and upload a file");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call and AI processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newDoc = {
        id: `DOC-${Date.now()}`,
        title: `New Document - ${uploadedFile.name}`,
        type: selectedDocType,
        uploadedBy: "Admin",
        uploadDate: "Just now",
        status: "reviewing",
        land: "New Property",
        extractedData: {
          ownerName: "John Doe",
          landAddress: "123 Main Street, Freetown",
          coordinates: { lat: 8.4657, lng: -13.2317 },
          previousOwner: "Jane Smith",
        },
      };

      setDocuments([newDoc, ...documents]);
      setUploadedFile(null);
      setSelectedDocType(null);
      alert("Document uploaded and AI analysis started!");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyDocument = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId ? { ...doc, status: "verified" } : doc
      )
    );
  };

  const handleRejectDocument = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId ? { ...doc, status: "rejected" } : doc
      )
    );
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
          <h1 className="text-3xl font-bold">Document Verification</h1>
          <p className="text-muted-foreground mt-1">Upload and verify land documents with AI assistance</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-background">
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background">
              Pending Verification
            </TabsTrigger>
            <TabsTrigger value="verified" className="rounded-lg data-[state=active]:bg-background">
              Verified
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8 bg-card border border-border rounded-2xl">
              <h2 className="text-2xl font-semibold mb-6">Upload New Document</h2>

              <div className="space-y-6">
                {/* Document Type Selection */}
                <div>
                  <Label className="text-lg font-medium mb-4 block">Select Document Type</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {documentTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setSelectedDocType(type.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedDocType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-lg font-medium mb-4 block">Upload Document File</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your file here, or click to select
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="bg-transparent">
                        <Upload className="w-4 h-4 mr-2" />
                        Select File
                      </Button>
                    </Label>
                    {uploadedFile && (
                      <p className="text-sm text-green-500 mt-4">
                        ✓ {uploadedFile.name} selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Supported formats:</strong> PDF, JPG, PNG, DOC, DOCX (Max 50MB)
                  </p>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleDocumentUpload}
                  disabled={isProcessing || !selectedDocType || !uploadedFile}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="space-y-4">
              {documents
                .filter((doc) => doc.status === "pending" || doc.status === "reviewing")
                .map((doc) => (
                  <DocumentReviewCard
                    key={doc.id}
                    document={doc}
                    onVerify={() => handleVerifyDocument(doc.id)}
                    onReject={() => handleRejectDocument(doc.id)}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Verified Tab */}
          <TabsContent value="verified" className="space-y-6">
            <div className="space-y-4">
              {documents
                .filter((doc) => doc.status === "verified")
                .map((doc) => (
                  <DocumentVerifiedCard key={doc.id} document={doc} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DocumentReviewCard({
  document,
  onVerify,
  onReject,
}: {
  document: any;
  onVerify: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{document.title}</h3>
            <Badge className="bg-yellow-500/10 text-yellow-500">
              {document.status === "reviewing" ? "Reviewing" : "Pending"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Land: {document.land} | Uploaded by: {document.uploadedBy} | {document.uploadDate}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Eye className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Extracted Data */}
      {document.extractedData && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
          <p className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            AI Extracted Data
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Owner Name</p>
              <p className="font-medium">{document.extractedData.ownerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Land Address</p>
              <p className="font-medium">{document.extractedData.landAddress}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Coordinates</p>
              <p className="font-medium font-mono text-xs">
                {document.extractedData.coordinates.lat}, {document.extractedData.coordinates.lng}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Previous Owner</p>
              <p className="font-medium">{document.extractedData.previousOwner}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onVerify}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Verify & Approve
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="flex-1 bg-transparent border-border hover:bg-muted"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </Card>
  );
}

function DocumentVerifiedCard({ document }: { document: any }) {
  return (
    <Card className="p-6 bg-card border border-green-500/20 rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-lg">{document.title}</h3>
            <Badge className="bg-green-500/10 text-green-500">Verified</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Land ID assigned | {document.uploadDate}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
