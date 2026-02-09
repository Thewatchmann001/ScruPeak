"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Mail,
  Phone,
  FileUp,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LandOwnerRegistration() {
  const [step, setStep] = useState<"registration" | "kyc" | "complete">(
    "registration"
  );
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [kycData, setKycData] = useState({
    idType: "passport",
    idNumber: "",
    address: "",
    city: "",
    state: "",
    idDocument: null as File | null,
    proofOfResidence: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleRegistrationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKYCChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setKycData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "idDocument" | "proofOfResidence"
  ) => {
    if (e.target.files) {
      setKycData((prev) => ({
        ...prev,
        [fieldName]: e.target.files![0],
      }));
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("kyc");
    }, 1500);
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("complete");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`flex items-center gap-3 ${
                step === "registration" || step === "kyc" || step === "complete"
                  ? ""
                  : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === "registration"
                    ? "bg-primary text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {step === "registration" ? "1" : "✓"}
              </div>
              <span
                className={
                  step === "registration"
                    ? "font-bold"
                    : "text-muted-foreground"
                }
              >
                Registration
              </span>
            </div>

            <div className="flex-1 h-1 mx-2 bg-border" />

            <div
              className={`flex items-center gap-3 ${
                step === "kyc" ? "" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === "kyc"
                    ? "bg-primary text-white"
                    : step === "complete"
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "complete" ? "✓" : "2"}
              </div>
              <span
                className={
                  step === "kyc"
                    ? "font-bold"
                    : step === "complete"
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                }
              >
                KYC Verification
              </span>
            </div>

            <div className="flex-1 h-1 mx-2 bg-border" />

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === "complete"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "complete" ? "✓" : "3"}
              </div>
              <span
                className={
                  step === "complete" ? "font-bold" : "text-muted-foreground"
                }
              >
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Registration Step */}
        {step === "registration" && (
          <Card className="p-8 border border-border">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Create Your Account</h1>
              <p className="text-muted-foreground mt-2">
                Register as a Land Owner to list and sell your land on LandBiznes
              </p>
            </div>

            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleRegistrationChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleRegistrationChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleRegistrationChange}
                  placeholder="+232 78 123 456"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Password</label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleRegistrationChange}
                  placeholder="Create a strong password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleRegistrationChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Card className="p-4 bg-blue-500/5 border border-blue-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Next Steps</p>
                    <ul className="text-muted-foreground mt-2 space-y-1">
                      <li>✓ Complete KYC verification (required)</li>
                      <li>✓ Await admin verification (usually 24-48 hours)</li>
                      <li>✓ Start listing your lands for sale</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 h-11"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Continue to KYC Verification"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </Card>
        )}

        {/* KYC Step */}
        {step === "kyc" && (
          <Card className="p-8 border border-border">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">KYC Verification</h1>
              <p className="text-muted-foreground mt-2">
                Verify your identity with government-issued ID and proof of residence
              </p>
            </div>

            <form onSubmit={handleKYCSubmit} className="space-y-4">
              {/* Address Fields */}
              <div className="space-y-2">
                <label className="block font-medium">Residential Address</label>
                <Input
                  type="text"
                  name="address"
                  value={kycData.address}
                  onChange={handleKYCChange}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-medium">City</label>
                  <Input
                    type="text"
                    name="city"
                    value={kycData.city}
                    onChange={handleKYCChange}
                    placeholder="Freetown"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-medium">State/District</label>
                  <Input
                    type="text"
                    name="state"
                    value={kycData.state}
                    onChange={handleKYCChange}
                    placeholder="Western Area"
                    required
                  />
                </div>
              </div>

              {/* ID Type & Number */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-medium">ID Type</label>
                  <select
                    name="idType"
                    value={kycData.idType}
                    onChange={handleKYCChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="passport">Passport</option>
                    <option value="national-id">National ID</option>
                    <option value="driver-license">Driver's License</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-medium">ID Number</label>
                  <Input
                    type="text"
                    name="idNumber"
                    value={kycData.idNumber}
                    onChange={handleKYCChange}
                    placeholder="Enter your ID number"
                    required
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload ID Document
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "idDocument")}
                    className="hidden"
                    id="idDoc"
                    accept="image/*,.pdf"
                  />
                  <label htmlFor="idDoc" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, PDF (Max 5MB)
                    </p>
                  </label>
                </div>
                {kycData.idDocument && (
                  <Badge className="bg-green-500/10 text-green-500">
                    ✓ {kycData.idDocument.name}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-medium flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Proof of Residence (Utility Bill, Bank Statement, etc.)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "proofOfResidence")}
                    className="hidden"
                    id="proofDoc"
                    accept="image/*,.pdf"
                  />
                  <label htmlFor="proofDoc" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, PDF (Max 5MB)
                    </p>
                  </label>
                </div>
                {kycData.proofOfResidence && (
                  <Badge className="bg-green-500/10 text-green-500">
                    ✓ {kycData.proofOfResidence.name}
                  </Badge>
                )}
              </div>

              <Card className="p-4 bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Privacy & Security</p>
                    <p className="text-muted-foreground mt-1">
                      Your documents are encrypted and securely stored. We never share your personal information without consent.
                    </p>
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                disabled={
                  loading ||
                  !kycData.idDocument ||
                  !kycData.proofOfResidence
                }
                className="w-full bg-primary hover:bg-primary/90 h-11"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting KYC...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card className="p-8 border border-green-500/20 bg-green-500/5">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">Registration Complete!</h1>
                <p className="text-muted-foreground mt-2">
                  Thank you for registering, {formData.fullName}
                </p>
              </div>

              <Card className="p-6 bg-background border border-border text-left">
                <h3 className="font-bold mb-4">What's Next?</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Verification Pending</p>
                      <p className="text-sm text-muted-foreground">
                        Our admin team will review your KYC documents (usually 24-48 hours)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Approval Email</p>
                      <p className="text-sm text-muted-foreground">
                        You'll receive an email when your account is approved
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Start Listing</p>
                      <p className="text-sm text-muted-foreground">
                        Once approved, you can immediately start listing your lands for sale
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3 justify-center pt-4">
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-primary hover:bg-primary/90">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
