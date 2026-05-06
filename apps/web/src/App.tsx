import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PremiumHero from '@/components/landing/PremiumHero';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { PremiumCTA } from '@/components/landing/PremiumCTA';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { MarketInsightsDashboard } from '@/components/insights/MarketInsightsDashboard';
import SellerDashboard from '@/components/seller/SellerDashboard';
import Home from '@/pages/Home';
import MarketplacePage from '@/pages/MarketplacePage';
import ChatPage from '@/pages/ChatPage';
import KycPage from '@/pages/KycPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminLandPage from '@/pages/admin/AdminLandPage';
import AdminKycPage from '@/pages/admin/AdminKycPage';
import AdminAgentsPage from '@/pages/admin/AdminAgentsPage';
import AdminTaxPage from '@/pages/admin/AdminTaxPage';
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
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/land/:id" element={<LandDetailPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/insights" element={<MarketInsightsDashboard />} />
                <Route path="/sell" element={<ProtectedRoute allowedRoles={['owner', 'agent']}><SellerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
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
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/agents" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminAgentsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminUsersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/lands" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminLandPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/kyc" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminKycPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tax" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminTaxPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* Auth Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<SignupPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
