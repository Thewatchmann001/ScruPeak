"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Menu, X, ArrowRight, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
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
          ? "bg-background/95 backdrop-blur-lg shadow-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Land<span className="text-primary">Biznes</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/#features">Features</NavLink>
            <NavLink to="/marketplace">Listings</NavLink>
            <NavLink to="/insights">Insights</NavLink>
            <NavLink to="/about">About</NavLink>
            
            {isAuthenticated && user?.role === 'buyer' && (
               user.has_pending_agent_application ? (
                 <span className="text-sm font-medium text-yellow-600 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200 cursor-help" title="Your agent application is currently under review.">
                   Application Pending
                 </span>
               ) : (
                 <NavLink to="/apply-role">Be a Seller / Agent</NavLink>
               )
            )}
             {isAuthenticated && (user?.role === 'owner' || user?.role === 'agent') && (
               <NavLink to="/sell">Dashboard</NavLink>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Hi, {user?.name?.split(' ')[0]}</span>
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="font-medium hover:bg-red-50 hover:text-red-600 transition-all duration-300"
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
                    className="font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-lg border-b border-border shadow-xl transition-all duration-500 overflow-hidden ${
          isMenuOpen
            ? "opacity-100 translate-y-0 max-h-96"
            : "opacity-0 -translate-y-4 max-h-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-6 space-y-4">
          <MobileNavLink 
            to="/#features" 
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </MobileNavLink>
          <MobileNavLink 
            to="/marketplace" 
            onClick={() => setIsMenuOpen(false)}
          >
            Listings
          </MobileNavLink>
          <MobileNavLink 
            to="/insights" 
            onClick={() => setIsMenuOpen(false)}
          >
            Insights
          </MobileNavLink>
          <MobileNavLink 
            to="/#about" 
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </MobileNavLink>
          
          {isAuthenticated && user?.role === 'buyer' && (
             <MobileNavLink to="/apply-role" onClick={() => setIsMenuOpen(false)}>Be a Seller / Agent</MobileNavLink>
          )}
           {isAuthenticated && (user?.role === 'owner' || user?.role === 'agent') && (
             <MobileNavLink to="/sell" onClick={() => setIsMenuOpen(false)}>Seller Dashboard</MobileNavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
             <MobileNavLink to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</MobileNavLink>
          )}

          <div className="pt-4 border-t border-border space-y-3">
            {isAuthenticated ? (
               <Button 
                variant="outline" 
                className="w-full bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Link to="/auth/login" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/register" className="block">
                  <Button className="w-full bg-primary text-primary-foreground">
                    Get Started
                  </Button>
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
      className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-300 relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

function MobileNavLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block py-3 text-lg font-medium hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
