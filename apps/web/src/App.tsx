1→import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PremiumHero from '@/components/landing/PremiumHero';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { PremiumCTA } from '@/components/landing/PremiumCTA';
import { TrustStrip } from '@/components/landing/TrustStrip';
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

// Main Landing Page
const HomePage = () => {
  const navigate = useNavigate();

  return (
  <div className="min-h-screen bg-gray-50">
    <PremiumHero />
    <TrustStrip />
    
    {/* Secure Land Registration Services Section - Matching the image structure */}
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Digital Land MarketPlace and Verification</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bringing transparency and efficiency to land ownership through cutting-edge technology and legal expertise.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Immutable ULID</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Every verified parcel is issued a Permanent Unique Land ID recorded on-chain, ensuring absolute proof of existence.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow">
             <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Verifiable History</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Ownership history is appended only after verified transactions, creating a transparent and unalterable audit trail.
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow">
             <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Fraud Resistance</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Blockchain anchoring prevents conflict and duplicate claims, making land-grabbing technically impossible.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
           <button
             onClick={() => navigate('/auth/login?redirect=/kyc')}
             className="inline-block px-8 py-3 bg-orange-50 text-orange-700 font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
             Register Your Land Now
           </button>
        </div>
      </div>
    </section>

    {/* How It Works Section */}
    <section className="py-20 bg-white">
       <div className="max-w-7xl mx-auto px-6 text-center">
         <h2 className="text-4xl font-black text-gray-900 mb-4">How It Works</h2>
         <p className="text-gray-600 mb-16">Our secure 6-step verification and escrow process ensures a safe transaction for all parties.</p>
         
         <div className="flex flex-wrap justify-center gap-8 relative">
           {/* Connecting line */}
           <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 hidden md:block" />
           
           {[
             { step: 1, title: "Verification", desc: "Land is verified and issued a ULID." },
             { step: 2, title: "Agreement", desc: "Buyer and seller agree on transaction." },
             { step: 3, title: "Escrow", desc: "Buyer funds are placed into ScruPeak Digital Property escrow." },
             { step: 4, title: "Final Checks", desc: "Final verification checks are executed." },
             { step: 5, title: "Transfer", desc: "Ownership transfer is written on-chain." },
             { step: 6, title: "Release", desc: "Funds are released to seller." }
           ].map((item) => (
             <div key={item.step} className="flex flex-col items-center max-w-[150px] relative z-10">
                <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center mb-4 shadow-lg ring-4 ring-white">
                  {item.step}
                </div>
                <h4 className="text-sm font-black text-gray-900 mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-tight">{item.desc}</p>
             </div>
           ))}
         </div>
       </div>
    </section>

    <FeaturedListings />
    <PremiumCTA />
  </div>
  );
};

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
