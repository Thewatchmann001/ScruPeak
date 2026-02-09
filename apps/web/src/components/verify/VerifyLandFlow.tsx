"use client";

import { useState } from "react";
import { VerificationBadge, VerificationIndicator } from "@/components/verification/VerificationUI";

type VerificationStep = "location" | "boundary" | "documents" | "results";

export function VerifyLandFlow() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>("location");
  const [location, setLocation] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationScore, setVerificationScore] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleVerify = () => {
    setVerificationScore(Math.floor(Math.random() * 40) + 60);
    setVerificationComplete(true);
    setCurrentStep("results");
  };

  const riskLevel =
    verificationScore >= 80 ? "low" : verificationScore >= 50 ? "medium" : "high";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-12 border-b border-neutral-200 bg-white">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Verify Your Land
        </h1>
        <p className="text-lg text-neutral-600">
          Get instant verification results with confidence scores
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        {!verificationComplete && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {["location", "boundary", "documents", "results"].map(
                (step, idx, arr) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        ["location", "boundary", "documents", "results"].indexOf(
                          currentStep
                        ) >= idx
                          ? "bg-primary-600 text-white"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < arr.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 transition-colors ${
                          ["location", "boundary", "documents", "results"].indexOf(
                            currentStep
                          ) > idx
                            ? "bg-primary-600"
                            : "bg-neutral-200"
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
            <div className="flex justify-between text-xs text-neutral-600 font-medium">
              <p>Location</p>
              <p>Boundary</p>
              <p>Documents</p>
              <p>Results</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === "location" && (
          <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Enter Land Location
              </h3>
              <p className="text-neutral-600">
                Start by telling us where your land is located
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  District / Chiefdom
                </label>
                <input
                  type="text"
                  placeholder="e.g., Western Area Urban"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Community
                </label>
                <input
                  type="text"
                  placeholder="e.g., Freetown"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Land Description
                </label>
                <textarea
                  placeholder="Describe the land boundaries and nearby landmarks"
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setCurrentStep("boundary")}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue to Boundary
            </button>
          </div>
        )}

        {currentStep === "boundary" && (
          <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Draw Land Boundary
              </h3>
              <p className="text-neutral-600">
                Use the map or upload a survey plan with marked boundaries
              </p>
            </div>

            <div className="h-64 bg-neutral-100 rounded-lg border border-neutral-300 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-neutral-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6.553 3.276A1 1 0 0021 20.382V9.618a1 1 0 00-1.447-.894L15 11m0 13V11m0 0L9 7"
                  />
                </svg>
                <p className="text-neutral-600 text-sm">
                  Map preview (Mapbox integration)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("location")}
                className="flex-1 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("documents")}
                className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Continue to Documents
              </button>
            </div>
          </div>
        )}

        {currentStep === "documents" && (
          <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Upload Documents
              </h3>
              <p className="text-neutral-600">
                Upload survey plans, deeds, and other ownership documents
              </p>
            </div>

            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg
                  className="w-12 h-12 text-neutral-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-neutral-900 font-semibold mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-neutral-600">
                  PDF, PNG, JPG (max 10MB each)
                </p>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-neutral-700">
                  {documents.length} file(s) uploaded:
                </p>
                <ul className="space-y-2">
                  {documents.map((doc, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-700 p-2 bg-neutral-50 rounded"
                    >
                      <svg
                        className="w-4 h-4 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {doc.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("boundary")}
                className="flex-1 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={documents.length === 0}
                className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
              >
                Get Verification Results
              </button>
            </div>
          </div>
        )}

        {currentStep === "results" && verificationComplete && (
          <div className="space-y-8">
            {/* Main Score */}
            <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                Verification Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <VerificationIndicator score={verificationScore} risk={riskLevel} />
                <div className="space-y-4">
                  <p className="text-neutral-700 text-lg">
                    Your land has been analyzed across multiple verification criteria.
                  </p>
                  <div className="space-y-2">
                    <VerificationBadge
                      status="verified"
                      label="Survey Plan Verified"
                      description="Documents are clear and authentic"
                    />
                    <VerificationBadge
                      status="verified"
                      label="No Title Disputes"
                      description="Court history is clear"
                    />
                    {riskLevel === "high" && (
                      <VerificationBadge
                        status="warning"
                        label="Additional Review Needed"
                        description="Some documents require clarification"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
              <h4 className="text-lg font-bold text-neutral-900 mb-6">
                Detailed Verification Report
              </h4>
              <div className="space-y-4">
                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-neutral-900">
                      Document Authentication
                    </p>
                    <p className="text-sm font-bold text-green-600">95%</p>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: "95%" }} />
                  </div>
                </div>

                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-neutral-900">
                      Boundary Verification
                    </p>
                    <p className="text-sm font-bold text-yellow-600">72%</p>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: "72%" }} />
                  </div>
                </div>

                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-neutral-900">
                      Title Clarity
                    </p>
                    <p className="text-sm font-bold text-green-600">88%</p>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: "88%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-neutral-900">
                      Community Validation
                    </p>
                    <p className="text-sm font-bold text-green-600">92%</p>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-primary-50 rounded-xl p-8 border border-primary-200">
              <h4 className="text-lg font-bold text-primary-900 mb-4">
                What's Next?
              </h4>
              <p className="text-primary-800 mb-6">
                Your verification report is now available. You can:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-primary-900">
                    Download your verification report
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-primary-900">
                    List your land on the marketplace
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-primary-900">
                    Share with potential buyers
                  </span>
                </li>
              </ul>

              <div className="flex gap-3">
                <button className="flex-1 py-3 border border-primary-600 text-primary-700 font-semibold rounded-lg hover:bg-primary-100 transition-colors">
                  Download Report
                </button>
                <button className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                  List on Marketplace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
