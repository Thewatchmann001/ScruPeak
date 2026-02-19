import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PremiumHero from '@/components/landing/PremiumHero';
import ProductShowcase from '@/components/landing/ProductShowcase';
import SocialProof from '@/components/landing/SocialProof';
import FeatureNarrative from '@/components/landing/FeatureNarrative';
import HowItWorks from '@/components/landing/HowItWorks';
import TrustSignals from '@/components/landing/TrustSignals';
import CTASection from '@/components/landing/CTASection';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { MarketInsightsDashboard } from '@/components/insights/MarketInsightsDashboard';
import SellerDashboard from '@/components/seller/SellerDashboard';
import MarketplacePage from '@/pages/MarketplacePage';
import ChatPage from '@/pages/ChatPage';
import KycPage from '@/pages/KycPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminLandPage from '@/pages/admin/AdminLandPage';
import AdminKycPage from '@/pages/admin/AdminKycPage';
import AdminAgentsPage from '@/pages/admin/AdminAgentsPage';
import AdminTaxPage from '@/pages/admin/AdminTaxPage';
import RoleApplicationPage from '@/pages/RoleApplicationPage';
import LandDetailPage from '@/components/land/LandDetailPage';
import { useState, useEffect } from 'react';
import { landService } from '@/services/landService';
import { Land } from '@/types';

// New Pages
import EscrowPage from '@/pages/EscrowPage';
import AboutPage from '@/pages/company/AboutPage';
import ContactPage from '@/pages/company/ContactPage';
import BlogPage from '@/pages/company/BlogPage';
import CareersPage from '@/pages/company/CareersPage';
import TermsPage from '@/pages/legal/TermsPage';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import CookiesPage from '@/pages/legal/CookiesPage';
import LicensesPage from '@/pages/legal/LicensesPage';
import PricingPage from '@/pages/PricingPage';
import FeaturesPage from '@/pages/FeaturesPage';

// Main Landing Page
const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <PremiumHero />
      <TrustSignals />
      <FeatureNarrative />
      <ProductShowcase />
      <div className="bg-slate-950 py-20 border-y border-white/5">
         <FeaturedListings />
      </div>
      <HowItWorks />
      <SocialProof />
      <CTASection />
    </div>
  );
};

const MapPage = () => {
  const [listings, setListings] = useState<Land[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await landService.search({ page_size: 100 });
        setListings(response.data.items || []);
      } catch (error) {
        console.error("Failed to fetch listings for map:", error);
      }
    };
    fetchListings();
  }, []);

  // Map backend Land type to InteractiveMap LandListing type
  const mapListings = listings.map(l => ({
    id: l.id,
    location: {
      country: "Sierra Leone",
      district: l.district || "Unknown",
      chiefdom: l.region || "Unknown",
      community: l.title,
      coordinates: [l.latitude, l.longitude] as [number, number]
    },
    price: Number(l.price),
    size: Number(l.size_sqm) / 4046.86, // convert to acres for map display
    sizeUnit: "acres" as const,
    purpose: "Investment",
    verificationScore: 85
  }));

  return (
    <div className="h-[calc(100vh-64px)]">
      <InteractiveMap listings={mapListings} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider />
        <div className="flex flex-col min-h-screen bg-slate-950">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/land/:id" element={<LandDetailPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/insights" element={<MarketInsightsDashboard />} />
              <Route path="/sell" element={<SellerDashboard />} />
              <Route path="/apply-role" element={<RoleApplicationPage />} />
              <Route path="/kyc" element={<KycPage />} />
              <Route path="/chat" element={<ChatPage />} />
              
              {/* Feature Pages */}
              <Route path="/escrow" element={<EscrowPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/features" element={<FeaturesPage />} />

              {/* Company Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/careers" element={<CareersPage />} />

              {/* Legal Pages */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/licenses" element={<LicensesPage />} />

              <Route path="/admin" element={
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              } />
              <Route path="/admin/agents" element={
                <AdminLayout>
                  <AdminAgentsPage />
                </AdminLayout>
              } />
              <Route path="/admin/users" element={
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              } />
              <Route path="/admin/lands" element={
                <AdminLayout>
                  <AdminLandPage />
                </AdminLayout>
              } />
              <Route path="/admin/kyc" element={
                <AdminLayout>
                  <AdminKycPage />
                </AdminLayout>
              } />
              <Route path="/admin/tax" element={
                <AdminLayout>
                  <AdminTaxPage />
                </AdminLayout>
              } />

              {/* Auth Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<SignupPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
