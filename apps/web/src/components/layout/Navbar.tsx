"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50
          ? "bg-slate-950/90 backdrop-blur-lg border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-orange-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              LAND<span className="text-orange-500">BIZNES</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/features">Technology</NavLink>
            <NavLink to="/pricing">Services</NavLink>
            <NavLink to="/about">About</NavLink>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-400">Hi, {user?.name?.split(' ')[0]}</span>
                {user?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" className="text-orange-500 hover:text-orange-400">Admin</Button>
                  </Link>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="text-slate-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-slate-400 hover:text-white transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 rounded-xl shadow-lg shadow-orange-600/25 transform hover:-translate-y-0.5 transition-all duration-300">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-white/5 transition-all duration-300 overflow-hidden ${
          isMenuOpen ? "opacity-100 max-h-screen py-8" : "opacity-0 max-h-0"
        }`}
      >
        <div className="px-6 space-y-6 text-center">
          <MobileNavLink to="/marketplace" onClick={() => setIsMenuOpen(false)}>Marketplace</MobileNavLink>
          <MobileNavLink to="/features" onClick={() => setIsMenuOpen(false)}>Technology</MobileNavLink>
          <MobileNavLink to="/pricing" onClick={() => setIsMenuOpen(false)}>Services</MobileNavLink>
          <MobileNavLink to="/about" onClick={() => setIsMenuOpen(false)}>About</MobileNavLink>
          
          <div className="pt-6 border-t border-white/5 space-y-4">
            {isAuthenticated ? (
               <Button 
                variant="outline" 
                className="w-full border-white/10 text-slate-400"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Link to="/auth/login" className="block">
                  <Button variant="outline" className="w-full border-white/10 text-white font-bold">Sign In</Button>
                </Link>
                <Link to="/auth/register" className="block">
                  <Button className="w-full bg-orange-600 text-white font-bold">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-slate-400 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors duration-300 relative group"
    >
      {children}
      <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

function MobileNavLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="block text-2xl font-black text-white tracking-tighter">
      {children}
    </Link>
  );
}
