"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  MapPin,
  DollarSign,
  Ruler,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function UploadLandPage() {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    area: "",
    dimensions: "",
    description: "",
    landType: "residential",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const landTypes = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "agricultural", label: "Agricultural" },
    { value: "industrial", label: "Industrial" },
    { value: "mixed", label: "Mixed Use" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate upload
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          title: "",
          location: "",
          price: "",
          area: "",
          dimensions: "",
          description: "",
          landType: "residential",
        });
        setImages([]);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">List Your Land</h1>
          <p className="text-muted-foreground mt-1">
            Sell your land quickly and securely with our AI-powered listing system
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Upload Land Details</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add pictures, location, price and key information
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-500/5 border border-green-500/20">
            <div className="flex items-start gap-3">
              <Loader className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 animate-spin-slow" />
              <div>
                <p className="font-medium text-sm">AI Processing</p>
                <p className="text-xs text-muted-foreground mt-1">
                  System analyzes and displays land details
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Go Live</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your listing appears on marketplace instantly
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="p-6 mb-8 bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-700">
                  Land Listed Successfully! 🎉
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Your land is now visible on the marketplace. Buyers can start viewing and making offers.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        <Card className="p-8 border border-border mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Land Images */}
            <div className="space-y-2">
              <label className="block font-medium">Land Images</label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="images"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium mb-1">Click to upload images</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop. PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {images.map((img, idx) => (
                    <Badge key={idx} className="bg-green-500/10 text-green-500">
                      ✓ {img.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block font-medium">Land Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Prime Residential Plot in Aberdeen"
                required
              />
              <p className="text-xs text-muted-foreground">
                Make it descriptive and attractive (50-150 characters recommended)
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Aberdeen, Freetown, Western Area Urban"
                required
              />
            </div>

            {/* Land Type & Price Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-medium">Land Type</label>
                <select
                  name="landType"
                  value={formData.landType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {landTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price (₦)
                </label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="45000"
                  required
                />
              </div>
            </div>

            {/* Area & Dimensions Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Area (sqm)
                </label>
                <Input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Dimensions</label>
                <Input
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 25m x 20m"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your land in detail. Mention features, amenities, access to utilities, nearby facilities, etc."
                rows={6}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                The more details you provide, the faster your land will sell
              </p>
            </div>

            {/* Terms */}
            <Card className="p-4 bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Before You List</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>✓ Have clear land documents ready for verification</li>
                    <li>✓ Provide accurate location and measurements</li>
                    <li>✓ Upload clear pictures of the land</li>
                    <li>✓ Set a competitive price</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.location}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Publishing Your Land...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish Land Listing
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="p-6 border border-border">
          <h3 className="font-bold mb-4">Tips for a Successful Listing</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">📸 Good Photos</p>
              <p className="text-muted-foreground">
                Use clear, well-lit photos taken during daytime. Include wide shots and close-ups of key features.
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">📝 Detailed Description</p>
              <p className="text-muted-foreground">
                Highlight unique features, nearby amenities, and why your land is special compared to others.
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">💰 Competitive Pricing</p>
              <p className="text-muted-foreground">
                Research similar properties in your area to set a realistic price. Our AI suggests fair market rates.
              </p>
            </div>
            <div>
              <p className="font-medium mb-2">📍 Accurate Location</p>
              <p className="text-muted-foreground">
                Be specific about the location with nearby landmarks, roads, and district information.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
