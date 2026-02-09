import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resetPassword } from '@/lib/auth-client';

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Better Auth usually handles token verification internally or via the same endpoint, but we need to pass it if we are using a specific flow. 
  // Actually, better-auth's resetPassword function usually takes newPassword and potentially the token if not automatically handled by the URL or if we are in a SPA flow.
  // Checking better-auth docs (mental model): resetPassword({ newPassword, token }) is common.

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // If better-auth handles the token verification on load, we might not need this manual check, but keeping it for UX is fine.
    if (!token) {
        // setServerError("Invalid or missing reset token."); 
        // Better Auth might verify token on submission or we can verify it on load if the client supports it.
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordValues) => {
    setServerError(null);

    // With better-auth, if the user clicked a link, the token might be in the URL.
    // The resetPassword client function usually expects { newPassword, token? }. 
    // If we are on the page with the token query param, we should pass it.

    try {
      const { error } = await resetPassword({
        newPassword: data.password,
        token: token || "" // Pass token from URL
      });
      
      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Password reset successfully');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || error.statusText || 'Failed to reset password';
      setServerError(msg);
      toast.error(msg);
    }
  };

  if (isSuccess) {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center"
        >
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Password Reset Complete
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Your password has been successfully updated. You can now login with your new password.
          </p>
          <div className="mt-8">
            <Link to="/auth/login">
                <Button className="w-full">
                    Proceed to Login
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
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Lock className="w-8 h-8 text-primary" />
            </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Set New Password
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Please enter your new password below.
          </p>
        </div>

        {serverError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                {serverError}
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-[30px] transition-colors group-focus-within:text-primary">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="New Password"
                label="New Password"
                {...register("password")}
                error={errors.password?.message}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-[30px] transition-colors group-focus-within:text-primary">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
              </div>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="Confirm Password"
                label="Confirm Password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex justify-center py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={isSubmitting || !token}
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Reset Password
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
