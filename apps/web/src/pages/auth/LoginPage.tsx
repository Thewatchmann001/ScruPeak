import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const from = searchParams.get('redirect') || location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Panel - Zillow Inspired Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary-hover p-16 flex-col justify-between relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <Link to="/" className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-10 h-10 bg-white text-primary rounded-lg flex items-center justify-center font-black">SP</span>
            ScruPeak
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Own Land with<br />Absolute Certainty
          </h2>
          <ul className="space-y-6">
            {[
              "Blockchain-backed property records",
              "Community-verified ownership claims",
              "Escrow-protected financial settlements"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-4 text-white/90 text-lg font-medium">
                <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-white/60 text-sm font-medium">
          © 2026 ScruPeak Digital Property. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 lg:hidden">
            <Link to="/" className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black">SP</span>
              ScruPeak
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Welcome back</h1>
          <p className="text-text-secondary mb-10 font-medium">Please sign in to continue.</p>

          <Button
            onClick={login}
            className="w-full h-12 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard text-lg"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In with Privy"}
          </Button>

          <p className="mt-10 text-center text-sm font-medium text-text-secondary">
            Don't have an account?{' '}
            <button onClick={login} className="text-primary font-bold hover:underline">Sign up</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
