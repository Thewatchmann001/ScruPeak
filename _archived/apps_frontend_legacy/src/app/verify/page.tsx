"use client";

import Link from "next/link";
import { VerifyLandFlow } from "@/components/verify/VerifyLandFlow";

export default function VerifyPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/landing"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Landing
          </Link>
        </div>
      </div>
      <VerifyLandFlow />
    </div>
  );
}
