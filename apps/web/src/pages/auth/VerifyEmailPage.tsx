import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center"
      >
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email Verification</h2>
          <p className="mt-2 text-gray-500 mb-8">
            Privy handles email verification automatically. Please sign in to verify your account.
          </p>
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
          <div className="mt-6 text-center">
            <Link
                to="/auth/login"
                className="inline-flex items-center font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
                Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
