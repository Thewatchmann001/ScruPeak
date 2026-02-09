import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        await api.post(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Your email has been successfully verified!');
      } catch (error: any) {
        console.error(error);
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Failed to verify email. The link may be expired or invalid.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying...</h2>
            <p className="mt-2 text-gray-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verified!</h2>
            <p className="mt-2 text-gray-500 mb-8">{message}</p>
            <Link to="/auth/login" className="w-full">
              <Button className="w-full">Login Now</Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-500 mb-8">{message}</p>
            <Link to="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">Back to Login</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
