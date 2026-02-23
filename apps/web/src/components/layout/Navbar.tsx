"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MapPin, Menu, X, ArrowRight, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck, Activity, Landmark, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDarkPage = location.pathname === '/sell' || location.pathname === '/kyc' || location.pathname === '/apply-role' || location.pathname === '/marketplace' || location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrollY > 20
          ? "bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-orange-600/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">
              Land<span className="text-orange-500">Biznes</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-1 rounded-2xl">
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/insights">Spatial Insights</NavLink>
            <NavLink to="/about">About System</NavLink>
            
            {isAuthenticated && user?.role === 'buyer' && (
               <NavLink to="/apply-role" highlight>Start Selling</NavLink>
            )}
             {isAuthenticated && (
               <NavLink to="/dashboard" icon={LayoutDashboard}>Overview</NavLink>
            )}
             {isAuthenticated && (user?.role === 'owner' || user?.role === 'agent') && (
               <NavLink to="/sell" highlight icon={Activity}>My Listings</NavLink>
            )}
            {isAuthenticated && user?.role === 'admin' && (
               <NavLink to="/admin" highlight icon={ShieldCheck}>Admin Portal</NavLink>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user?.role}</span>
                   <span className="text-sm font-black text-white">{user?.name?.split(' ')[0]}</span>
                </div>

                <div className="flex items-center gap-2">
                   <button className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center relative">
                      <Bell size={18} />
                      <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
                   </button>

                   {!user?.kyc_verified && (
                      <Button
                        onClick={() => navigate('/kyc')}
                        className="bg-orange-600/10 text-orange-500 border border-orange-500/20 hover:bg-orange-600 hover:text-white rounded-xl font-bold transition-all px-4"
                      >
                        Verify Identity
                      </Button>
                   )}

                   <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                    title="Logout"
                   >
                    <LogOut size={18} />
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-bold px-6"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl px-8 shadow-lg shadow-orange-600/20 transform hover:-translate-y-0.5 transition-all">
                    Register Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-3 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-[#1e293b] border border-slate-800 rounded-3xl shadow-2xl p-6 z-[101]"
          >
            <div className="space-y-4">
              <MobileNavLink to="/marketplace" onClick={() => setIsMenuOpen(false)}>Marketplace</MobileNavLink>
              <MobileNavLink to="/insights" onClick={() => setIsMenuOpen(false)}>Spatial Insights</MobileNavLink>

              {isAuthenticated ? (
                <>
                  <div className="h-px bg-slate-800 my-4" />
                  <MobileNavLink to="/sell" onClick={() => setIsMenuOpen(false)}>Dashboard</MobileNavLink>
                  {!user?.kyc_verified && (
                    <MobileNavLink to="/kyc" onClick={() => setIsMenuOpen(false)} highlight>Complete KYC</MobileNavLink>
                  )}
                  <Button onClick={handleLogout} variant="destructive" className="w-full h-12 rounded-xl font-bold mt-6">
                     Logout
                  </Button>
                </>
              ) : (
                <div className="grid gap-3 pt-4">
                  <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full h-12 border-slate-700 text-white rounded-xl">Login</Button>
                  </Link>
                  <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-12 bg-orange-600 text-white font-bold rounded-xl">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ to, children, highlight, icon: Icon }: { to: string; children: React.ReactNode; highlight?: boolean; icon?: any }) {
  return (
    <Link
      to={to}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
        highlight
          ? "bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  );
}

function MobileNavLink({ to, onClick, children, highlight }: { to: string; onClick: () => void; children: React.ReactNode; highlight?: boolean }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 rounded-xl font-bold ${
        highlight ? "bg-orange-600 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
