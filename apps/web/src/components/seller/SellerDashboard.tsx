import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, MoreHorizontal, Eye, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { CreateListingModal } from "./CreateListingModal";
import { Land } from "@/types";

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/land/my-listings');
      setListings(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }
  }, [isAuthenticated]);

  // Derived metrics
  // Note: Views and Inquiries are mocked for now as backend support is pending
  const totalViews = listings.length * 124; // Mocked average
  const totalInquiries = listings.length * 8; // Mocked average
  const avgVerification = listings.length > 0 ? 85 : 0; // Mocked score

  const handleListingCreated = () => {
    fetchListings();
  };

  if (!isAuthenticated) return null;

  const handleCreateListing = () => {
    // If KYC is not verified, redirect to KYC page
    if (!user?.kyc_verified) {
      // Use navigate with state to show a message on the KYC page if desired
      navigate('/kyc');
      return;
    }
    
    // Only open modal if verified
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8 border-b border-neutral-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Seller Dashboard
            </h1>
            <p className="text-neutral-600">
              Welcome back, {user?.name}. Manage your listings and track performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex">
              Export Report
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={handleCreateListing}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Listing
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Listings"
            value={listings.filter(l => l.status === 'available').length.toString()}
            subtext={`${listings.filter(l => l.status === 'sold').length} sold total`}
          />
          <MetricCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            subtext="↑ 12% this month"
            valueColor="text-neutral-900"
          />
          <MetricCard
            title="Total Inquiries"
            value={totalInquiries.toLocaleString()}
            subtext="Avg. 8 per listing"
            valueColor="text-neutral-900"
          />
          <MetricCard
            title="Trust Score"
            value={`${avgVerification}%`}
            subtext="High credibility"
            valueColor="text-green-600"
          />
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-neutral-900">Your Properties</h2>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search listings..." 
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Property</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Size</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Blockchain</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Engagement</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No listings found. Create your first property listing today!
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-900">{listing.title}</span>
                          <span className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-3 h-3" />
                            {listing.district}, {listing.region}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {listing.size_sqm ? (listing.size_sqm / 4046.86).toFixed(2) : '0'} Acres
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        SLE {listing.price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-6 py-4">
                        {listing.blockchain_hash ? (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium" title={listing.blockchain_hash}>
                            <ShieldCheck className="w-4 h-4" />
                            <span className="truncate max-w-[80px]">{listing.blockchain_hash.slice(0, 8)}...</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pending...</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-1" title="Views">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>124</span>
                          </div>
                          <div className="flex items-center gap-1" title="Inquiries">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span>8</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {listings.length > 0 && (
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/30 flex justify-between items-center">
              <span className="text-sm text-gray-500">Showing {listings.length} properties</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleListingCreated}
      />
    </div>
  );
}

function MetricCard({ title, value, subtext, valueColor = "text-neutral-900" }: { title: string, value: string, subtext: string, valueColor?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
      <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-2">
        {title}
      </p>
      <p className={`text-3xl font-bold ${valueColor}`}>
        {value}
      </p>
      <p className="text-xs text-neutral-500 mt-2 font-medium">
        {subtext}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    available: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    sold: "bg-blue-100 text-blue-700 border-blue-200",
    disputed: "bg-red-100 text-red-700 border-red-200",
  };
  
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const className = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
