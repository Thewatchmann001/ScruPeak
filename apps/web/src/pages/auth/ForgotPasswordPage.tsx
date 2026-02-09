import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgetPassword } from '@/lib/auth-client';

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await forgetPassword({
        email: data.email,
        redirectTo: "/auth/reset-password",
      });
      if (error) throw error;
      setIsSent(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center"
        >
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Check your email
          </h2>
          <p className="mt-2 text-base text-gray-500">
            We've sent password reset instructions to your email address.
          </p>
          <div className="mt-8">
            <Link to="/auth/login">
                <Button className="w-full">
                    Back to Login
                </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-[30px] transition-colors group-focus-within:text-primary">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
              </div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="Email address"
                label="Email"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
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
        </form>
      </motion.div>
    </div>
  );
}
