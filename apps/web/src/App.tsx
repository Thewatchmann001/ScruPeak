import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PremiumHero from '@/components/landing/PremiumHero';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { MarketInsightsDashboard } from '@/components/insights/MarketInsightsDashboard';
import SellerDashboard from '@/components/seller/SellerDashboard';
import MarketplacePage from '@/pages/MarketplacePage';
import ChatPage from '@/pages/ChatPage';
import KycPage from '@/pages/KycPage';
// import DashboardLayout from '@/components/layout/DashboardLayout';
// import DashboardPage from '@/pages/dashboard/DashboardPage';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';
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
import RoleApplicationPage from '@/pages/RoleApplicationPage';
import LandDetailPage from '@/components/land/LandDetailPage';

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

// Placeholder pages
const HomePage = () => (
  <div className="min-h-screen bg-gray-50">
    <PremiumHero />
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">Featured Listings</h2>
      <div className="text-center">
        <a href="/marketplace" className="text-primary-600 hover:underline text-lg">
          Browse All Lands in Marketplace &rarr;
        </a>
      </div>
    </div>
  </div>
);

const MapPage = () => (
  <div className="h-[calc(100vh-64px)]">
    <InteractiveMap listings={[]} />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider />
        <div className="flex flex-col min-h-screen">
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
