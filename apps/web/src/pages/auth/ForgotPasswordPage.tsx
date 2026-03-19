import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100"
      >
        <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Mail className="w-8 h-8 text-primary" />
            </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Forgot Password?
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Privy handles password resets automatically. Please sign in to manage your account.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button
            onClick={login}
            className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              "Sign In with Privy"
            )}
          </Button>

          <div className="text-center">
            <Link
                to="/auth/login"
                className="inline-flex items-center font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
