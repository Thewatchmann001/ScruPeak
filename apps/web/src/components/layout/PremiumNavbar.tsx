"use client";

import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PremiumNavbar() {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/landing" className="flex items-center space-x-3">
            <img
              src="/images/logo.jpg"
              alt="ScruPeak Logo"
              className="w-10 h-10 rounded-lg object-cover shadow-soft"
            />
            <span className="text-xl font-bold text-neutral-900 hidden sm:inline">ScruPeak</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link
              to="/explore"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              Explore Land
            </Link>
            <Link
              to="/map"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              Map
            </Link>
            <Link
              to="/insights"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              Market Insights
            </Link>
            <Link
              to="/verify"
              className="text-neutral-700 hover:text-primary transition-colors font-medium"
            >
              Verify Land
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/landing"
                  className="text-sm text-neutral-700 hover:text-primary"
                >
                  Home
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/landing"
                  className="text-sm text-neutral-700 hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  to="/landing"
                  className="px-4 py-2 text-sm bg-primary/90 text-white rounded-lg hover:bg-primary/90 transition-colors shadow-soft"
                >
                  Explore
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Sheet */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-neutral-200">
        <div className="flex items-center justify-around py-3">
          <Link
            to="/landing"
            className="flex flex-col items-center space-y-1 text-neutral-600 hover:text-primary"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 4l4 2m-2-4l-4-2"
              />
            </svg>
            <span className="text-xs">Home</span>
          </Link>

          <Link
            to="/explore"
            className="flex flex-col items-center space-y-1 text-neutral-600 hover:text-primary"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-xs">Explore</span>
          </Link>

          <Link
            to="/map"
            className="flex flex-col items-center space-y-1 text-neutral-600 hover:text-primary"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6.553 3.276A1 1 0 0021 20.382V9.618a1 1 0 00-1.447-.894L15 11m0 13V11m0 0L9 7"
              />
            </svg>
            <span className="text-xs">Map</span>
          </Link>

          <Link
            to="/insights"
            className="flex flex-col items-center space-y-1 text-neutral-600 hover:text-primary"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="text-xs">Insights</span>
          </Link>

          <Link
            to="/verify"
            className="flex flex-col items-center space-y-1 text-neutral-600 hover:text-primary"
          >
            <svg
              className="w-6 h-6"
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
            <span className="text-xs">Verify</span>
          </Link>
        </div>
      </nav>

      {/* Add padding to push content below navbar */}
      <div className="h-16 hidden md:block" />
      <div className="h-20 md:hidden" />
    </>
  );
}
