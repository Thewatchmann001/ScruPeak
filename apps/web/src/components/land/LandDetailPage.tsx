"use client";

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { VerificationBadge, VerificationIndicator } from "@/components/verification/VerificationUI";
import { landService } from "@/services/landService";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X } from "lucide-react";
import { useToast } from "@/context/ToastProvider";

// Extended interface to include status
interface LandDetailProps {
  id?: string;
  status?: string; // available, under_notice, disputed, sold
  location?: {
    country: string;
    district: string;
    chiefdom: string;
    community: string;
  };
  size?: number;
  sizeUnit?: "sqm" | "acres";
  purpose?: string;
  price?: number;
  verificationScore?: number;
  ownership?: {
    familyName: string;
    yearsHeld: number;
    dispute: boolean;
  };
  documents?: Array<{
    type: string;
    status: "verified" | "pending" | "flagged";
    date: string;
  }>;
  risks?: string[];
  mapImage?: string;
}

export default function LandDetailPage(props: LandDetailProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const [land, setLand] = useState<LandDetailProps>(props);
  const [loading, setLoading] = useState(!props.id && !!paramId);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "documents" | "intelligence">("overview");
  
  // Objection Form State
  const [objectionReason, setObjectionReason] = useState("");
  const [submittingObjection, setSubmittingObjection] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // If no props provided, fetch data using ID
    if (!props.id && paramId) {
      setLoading(true);
      // In a real app, we would fetch from API
      // landService.getById(paramId).then(...)
      // For now, we simulate fetching and use mock data mixed with params
      setTimeout(() => {
        setLand({
            id: paramId,
            status: "under_notice", // SIMULATED STATUS FOR DEMO
            location: {
                country: "Sierra Leone",
                district: "Western Area Rural",
                chiefdom: "Waterloo",
                community: "Bureh Town"
            },
            size: 2500,
            sizeUnit: "sqm",
            purpose: "Residential",
            price: 45000,
            verificationScore: 92,
            ownership: {
                familyName: "Kamara Family",
                yearsHeld: 45,
                dispute: false
            },
            documents: [
                { type: "Survey Plan", status: "verified", date: "2023-11-15" },
                { type: "Title Deed", status: "verified", date: "2023-10-01" },
                { type: "Tax Receipt", status: "pending", date: "2024-01-10" }
            ],
            risks: [],
            mapImage: "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-13.123,8.456,16,0/800x600?access_token=pk.mock"
        });
        setLoading(false);
      }, 1000);
    }
  }, [paramId, props.id]);

  const handleLodgeObjection = async () => {
    if (!objectionReason || objectionReason.length < 10) {
        showToast("Please provide a detailed reason (min 10 chars)", "error");
        return;
    }
    
    setSubmittingObjection(true);
    try {
        if (land.id) {
            await landService.lodgeObjection(land.id, objectionReason);
            showToast("Objection lodged successfully. Admin will review.", "success");
            setShowObjectionModal(false);
            setObjectionReason("");
            // Update status locally
            setLand(prev => ({ ...prev, status: "disputed" }));
        }
    } catch (error) {
        showToast("Failed to lodge objection", "error");
    } finally {
        setSubmittingObjection(false);
    }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Fallback if no data
  if (!land.location) return <div className="min-h-screen flex items-center justify-center">Land not found</div>;

  const riskLevel = (land.verificationScore || 0) >= 80 ? "low" : (land.verificationScore || 0) >= 50 ? "medium" : "high";

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Back Button */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            to="/explore"
            className="flex items-center gap-2 text-primary hover:text-primary/90 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Explore
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      {land.status === "under_notice" && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center text-primary/90">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Public Notice Period Active</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm">Community members may lodge objections until Feb 28, 2026</span>
                </div>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary/30 text-primary/90 hover:bg-primary/10"
                    onClick={() => setShowObjectionModal(true)}
                >
                    Lodge Objection
                </Button>
            </div>
        </div>
      )}

      {land.status === "disputed" && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="max-w-5xl mx-auto flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-medium">Property Under Dispute - Transactions Suspended</span>
            </div>
        </div>
      )}

      {/* Map Section */}
      {land.mapImage && (
        <div className="h-96 bg-neutral-200 relative overflow-hidden">
          <img
            src={land.mapImage}
            alt="Land map"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg shadow-soft text-sm font-medium hover:bg-neutral-50">
              Satellite
            </button>
            <button className="px-4 py-2 bg-white rounded-lg shadow-soft text-sm font-medium hover:bg-neutral-50">
              Terrain
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-2">
                  {land.location.country} • {land.location.district} • {land.location.chiefdom}
                </p>
                <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                  {land.location.community}
                </h1>
                <p className="text-lg text-neutral-600">
                  {land.size?.toLocaleString()} {land.sizeUnit} • {land.purpose}
                </p>
              </div>
            </div>

            {/* Key Facts */}
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Key Facts
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">Price</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${land.price?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Size
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {land.size?.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-600">{land.sizeUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Price / {land.sizeUnit}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${Math.round((land.price || 0) / (land.size || 1))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 mb-2 uppercase font-semibold">
                    Purpose
                  </p>
                  <p className="text-lg font-bold text-primary-600 capitalize">
                    {land.purpose}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200">
              <div className="flex gap-8">
                {["overview", "documents", "intelligence"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setSelectedTab(
                        tab as "overview" | "documents" | "intelligence"
                      )
                    }
                    className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                      selectedTab === tab
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Ownership Info */}
                <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                  <h4 className="font-semibold text-neutral-900 mb-4">
                    Ownership Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Family Name:</span>
                      <span className="font-medium text-neutral-900">
                        {land.ownership?.familyName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Years Held:</span>
                      <span className="font-medium text-neutral-900">
                        {land.ownership?.yearsHeld} years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Court Dispute:</span>
                      <span
                        className={`font-medium ${
                          land.ownership?.dispute
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {land.ownership?.dispute ? "Flagged" : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risks */}
                {land.risks && land.risks.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                    <h4 className="font-semibold text-neutral-900 mb-4">
                      Risk Indicators
                    </h4>
                    <div className="space-y-2">
                      {land.risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0v-2"
                            />
                          </svg>
                          <span className="text-sm text-neutral-700">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "documents" && (
              <div className="space-y-4">
                {land.documents?.map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft flex items-center justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-neutral-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-semibold text-neutral-900">
                          {doc.type}
                        </h5>
                        <p className="text-sm text-neutral-600">{doc.date}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === "verified"
                          ? "bg-green-50 text-green-700"
                          : doc.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "intelligence" && (
              <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
                <h4 className="font-semibold text-neutral-900 mb-4">
                  Land Intelligence
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Development Corridor:</span>
                    <span className="font-medium">Primary Growth Zone</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Accessibility:</span>
                    <span className="font-medium">High (Paved Road)</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <span className="text-neutral-700">Infrastructure:</span>
                    <span className="font-medium">Water & Power Nearby</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700">Flood Risk:</span>
                    <span className="font-medium text-green-600">Low</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Score */}
            <VerificationIndicator score={land.verificationScore || 0} risk={riskLevel} />

            {/* Verification Details */}
            <div className="space-y-3">
              <VerificationBadge
                status="verified"
                label="Survey Plan Verified"
                description="Confirmed by licensed surveyor"
              />
              <VerificationBadge
                status="verified"
                label="Community Confirmed"
                description="Local stakeholders validated"
              />
              <VerificationBadge
                status={land.ownership?.dispute ? "flag" : "verified"}
                label={land.ownership?.dispute ? "Court Dispute Detected" : "No Disputes"}
                description={land.ownership?.dispute ? "Pending investigation" : "Clear court history"}
              />
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft">
                Make Inquiry
              </button>
              <button className="w-full py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors">
                Save to List
              </button>
            </div>

            {/* Contact Seller */}
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-soft">
              <h4 className="font-semibold text-neutral-900 mb-4">Contact Seller</h4>
              <button className="w-full py-2 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Objection Modal */}
      {showObjectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Lodge Objection</h3>
                    <button onClick={() => setShowObjectionModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-primary/90">
                        <p className="font-medium">Warning: False Claims</p>
                        <p>Lodging a false objection is a punishable offense. Your identity will be recorded on-chain.</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Objection</label>
                        <textarea 
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Describe your claim (e.g., boundary dispute, inheritance claim)..."
                            value={objectionReason}
                            onChange={(e) => setObjectionReason(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Evidence (Optional URL)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowObjectionModal(false)}>Cancel</Button>
                    <Button 
                        onClick={handleLodgeObjection} 
                        disabled={submittingObjection}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {submittingObjection ? "Submitting..." : "Submit Objection"}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
