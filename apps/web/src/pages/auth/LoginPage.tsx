import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Prioritize redirect param, then location state, then default to home
  const from = searchParams.get('redirect') || location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(error);
      const msg = error.message || error.statusText || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
            Welcome back
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Sign in to continue your journey with LandBiznes
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

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-[30px] transition-colors group-focus-within:text-primary">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="Password"
                label="Password"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center top-[30px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/auth/forgot-password"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </Link>
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/auth/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
