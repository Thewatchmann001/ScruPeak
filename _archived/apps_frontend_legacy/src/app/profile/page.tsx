"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    email: user?.email || "",
    name: user?.name || "",
    phone: "+232 XX XXX XXXX",
    role: user?.role || "buyer",
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-12 border-b border-neutral-200 bg-white">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Your Profile
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl p-8 border border-neutral-200 shadow-soft">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={profile.name}
                readOnly
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                readOnly
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50"
              />
            </div>

            <button
              onClick={logout}
              className="w-full py-3 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
