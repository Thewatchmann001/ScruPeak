"use client";

import { Card } from "@/components/ui/card"

import React from "react"

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  MapPin,
  Lock,
  Bot,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
  Users,
  FileCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          style={{
            top: "10%",
            right: "-10%",
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bg-accent/10 blur-3xl"
          style={{
            bottom: "20%",
            left: "-5%",
            transform: `translateY(${scrollY * -0.08}px)`,
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full bg-secondary/10 blur-2xl"
          style={{
            top: "50%",
            right: "20%",
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 50
            ? "bg-background/95 backdrop-blur-lg shadow-lg border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Land<span className="text-primary">Biznes</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How It Works</NavLink>
              <NavLink href="#security">Security</NavLink>
              <NavLink href="/land">Listings</NavLink>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
          className={`md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-lg border-b border-border shadow-xl transition-all duration-500 ${
            isMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            <MobileNavLink href="#features" onClick={() => setIsMenuOpen(false)}>
              Features
            </MobileNavLink>
            <MobileNavLink href="#how-it-works" onClick={() => setIsMenuOpen(false)}>
              How It Works
            </MobileNavLink>
            <MobileNavLink href="#security" onClick={() => setIsMenuOpen(false)}>
              Security
            </MobileNavLink>
            <MobileNavLink href="/land" onClick={() => setIsMenuOpen(false)}>
              Listings
            </MobileNavLink>
            <div className="pt-4 border-t border-border space-y-3">
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" className="block">
                <Button className="w-full bg-primary text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-pulse-slow">
                <Shield className="w-4 h-4" />
                Verified Secure Transactions
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                The Trusted
                <span className="text-primary block mt-2">Land Marketplace</span>
                for Sierra Leone
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Buy and sell land with confidence. Our platform ensures
                verified listings, secure escrow payments, and transparent
                ownership records.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/land">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Explore Listings
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-lg px-8 py-6 border-2 hover:bg-secondary hover:text-secondary-foreground transition-all duration-300 bg-transparent"
                  >
                    List Your Land
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 rounded-full border-2 border-primary/20 animate-pulse-slow" />
                  <div className="absolute w-64 h-64 rounded-full border border-primary/30 animate-spin-slow" />
                  <div className="absolute w-48 h-48 rounded-full border border-accent/20" />
                </div>
                {/* Center icon */}
                <div className="relative flex items-center justify-center h-96">
                  <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 animate-float">
                    <MapPin className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute top-12 left-0 px-4 py-3 bg-card shadow-xl border border-border rounded-xl animate-float-delayed">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Verified</span>
                  </div>
                </div>
                <div className="absolute bottom-16 right-0 px-4 py-3 bg-card shadow-xl border border-border rounded-xl animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Everything You Need for
              <span className="text-primary"> Safe Land Deals</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with local expertise to
              make land transactions seamless and secure.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="AI Verification"
              description="Our AI system analyzes documents, detects fraud patterns, and verifies authenticity before listings go live."
              delay="0"
            />
            <FeatureCard
              icon={<Lock className="w-7 h-7" />}
              title="Escrow Payments"
              description="Funds are securely held until all documents are verified and both parties confirm the transaction."
              delay="100"
            />
            <FeatureCard
              icon={<FileCheck className="w-7 h-7" />}
              title="Document Verification"
              description="Every document is verified and ownership history is securely recorded for transparency."
              delay="200"
            />
            <FeatureCard
              icon={<Bot className="w-7 h-7" />}
              title="Smart Chatbot"
              description="Get instant answers and fraud warnings with our AI-powered chatbot that guides you through the process."
              delay="300"
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="Verified Agents"
              description="All agents are verified through ministry records and our platform verification system."
              delay="400"
            />
            <FeatureCard
              icon={<Wallet className="w-7 h-7" />}
              title="Dual Currency"
              description="Pay in SLL or USD. Our platform handles currency conversion and supports local payment methods."
              delay="500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">
              Process
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              How It<span className="text-primary"> Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number="01"
              title="Browse Listings"
              description="Explore verified land listings with detailed information, maps, and pricing."
            />
            <StepCard
              number="02"
              title="Express Interest"
              description="Contact sellers through our secure platform and request full details."
            />
            <StepCard
              number="03"
              title="Secure Payment"
              description="Deposit funds into our escrow system for protection until verification."
            />
            <StepCard
              number="04"
              title="Complete Transfer"
              description="Once verified, ownership transfers and the transaction is securely recorded."
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                Security First
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Your Transactions Are Protected
              </h2>
              <p className="text-lg opacity-80 leading-relaxed">
                We combine AI-powered fraud detection with advanced security
                to ensure every transaction on LandBiznes is secure and
                transparent.
              </p>
              <ul className="space-y-4">
                <SecurityFeature text="AI-powered document verification" />
                <SecurityFeature text="Secure ownership records" />
                <SecurityFeature text="Admin-controlled escrow release" />
                <SecurityFeature text="Real-time fraud alerts" />
                <SecurityFeature text="24/7 support assistance" />
              </ul>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                >
                  Start Secure Trading
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-slow" />
                <div className="absolute inset-4 rounded-full border-2 border-primary/20 animate-spin-slow" />
                <div className="absolute inset-8 rounded-full border border-primary/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/50">
                    <Shield className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Ready to Find Your
            <span className="text-primary"> Perfect Land?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of buyers and sellers who trust LandBiznes for their
            land transactions in Sierra Leone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/land">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-xl shadow-primary/25"
              >
                Browse Listings
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6 border-2 bg-transparent"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">
                  Land<span className="text-primary">Biznes</span>
                </span>
              </Link>
              <p className="text-sm opacity-70">
                Sierra Leone's most trusted land marketplace with verified
                secure transactions.
              </p>
            </div>
            <FooterColumn
              title="Platform"
              links={[
                { label: "Listings", href: "/land" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "Escrow", href: "/escrow" },
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                { label: "About Us", href: "#" },
                { label: "Contact", href: "#" },
                { label: "Careers", href: "#" },
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                { label: "Terms", href: "#" },
                { label: "Privacy", href: "#" },
                { label: "Licenses", href: "#" },
              ]}
            />
          </div>
          <div className="pt-8 border-t border-background/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm opacity-70">
              2026 LandBiznes. All rights reserved.
            </p>
            <p className="text-sm opacity-70">Made with trust for Sierra Leone</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-50%) translateX(10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-300 relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between py-3 text-lg font-medium hover:text-primary transition-colors"
    >
      {children}
      <ChevronRight className="w-5 h-5" />
    </Link>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <Card
      className="p-6 bg-card border border-border rounded-2xl hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-500 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative group">
      <div className="text-7xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors duration-300">
        {number}
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SecurityFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
      </div>
      <span className="opacity-90">{text}</span>
    </li>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
