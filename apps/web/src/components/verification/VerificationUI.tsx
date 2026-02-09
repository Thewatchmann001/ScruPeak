"use client";

import { ReactNode } from "react";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "flag" | "warning";
  label: string;
  description?: string;
}

export function VerificationBadge({
  status,
  label,
  description,
}: VerificationBadgeProps) {
  const statusConfig = {
    verified: {
      bg: "bg-green-50",
      border: "border-green-200",
      dot: "bg-green-500",
      text: "text-green-900",
    },
    pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      dot: "bg-yellow-500",
      text: "text-yellow-900",
    },
    flag: {
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      text: "text-red-900",
    },
    warning: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-orange-500",
      text: "text-orange-900",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`${config.bg} ${config.border} rounded-lg border p-4`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`${config.dot} w-3 h-3 rounded-full mt-1.5 flex-shrink-0`}
        />
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${config.text} mb-1`}>
            {label}
          </h4>
          {description && (
            <p className={`text-xs ${config.text} opacity-75`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerificationIndicator({
  score,
  risk,
}: {
  score: number;
  risk: "low" | "medium" | "high";
}) {
  const riskConfig = {
    low: { color: "text-green-600", bg: "bg-green-50", label: "Low Risk" },
    medium: { color: "text-yellow-600", bg: "bg-yellow-50", label: "Medium Risk" },
    high: { color: "text-red-600", bg: "bg-red-50", label: "High Risk" },
  };

  const config = riskConfig[risk];

  return (
    <div className={`${config.bg} rounded-lg p-6 text-center`}>
      <div className="flex justify-center mb-4">
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            className="text-neutral-200"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score * 2.83} 283`}
            className={config.color}
            strokeLinecap="round"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy="0.3em"
            className={`text-3xl font-bold ${config.color}`}
          >
            {score}%
          </text>
        </svg>
      </div>
      <p className={`font-semibold mb-1 ${config.color}`}>
        Verification Score
      </p>
      <p className="text-xs text-neutral-600">{config.label}</p>
    </div>
  );
}
