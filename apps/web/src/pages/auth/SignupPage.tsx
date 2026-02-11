import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["buyer", "owner"]).default("buyer"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "buyer"
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      await registerAuth(data.email, data.password, data.name, data.role);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || error.statusText || 'Registration failed';
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
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-base text-gray-500">
            Join LandBiznes to buy, sell, and verify land securely
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none top-[30px] transition-colors group-focus-within:text-primary">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
              </div>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="Full Name"
                label="Full Name"
                error={errors.name?.message}
                {...register("name")}
              />
            </div>

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
                autoComplete="new-password"
                className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all duration-200"
                placeholder="Create a password"
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
            
            {/* Role selection removed as per user request */}
            <input type="hidden" value="buyer" {...register("role")} />

          </div>

          <Button
            type="submit"
            className="w-full flex justify-center py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                        Already have an account?
                    </span>
                </div>
            </div>

            <div className="mt-6 text-center">
                <Link
                    to="/auth/login"
                    className="inline-flex items-center font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                    Sign in to your account
                </Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
