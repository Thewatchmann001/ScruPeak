import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle2, ChevronRight, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { signIn } from '@/lib/auth-client';

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "buyer"
    }
  });

  const selectedRole = watch("role");

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

  const handleGoogleLogin = async () => {
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.origin + '/',
      });
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary-hover p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <Link to="/" className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-10 h-10 bg-white text-primary rounded-lg flex items-center justify-center font-black">SP</span>
            ScruPeak
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Start Your Property<br />Journey Today
          </h2>
          <ul className="space-y-6">
            {[
              "Free to browse thousands of listings",
              "Advanced spatial filtering technology",
              "Direct connection with verified owners"
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

      {/* Right Panel - Signup Form */}
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

          <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Create an account</h1>
          <p className="text-text-secondary mb-10 font-medium">Join thousands of people finding verified land.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setValue("role", "buyer")}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-bold transition-standard ${selectedRole === "buyer" ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-muted hover:border-text-muted'}`}
                >
                  I want to Buy
                </button>
                <button
                  type="button"
                  onClick={() => setValue("role", "owner")}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-bold transition-standard ${selectedRole === "owner" ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-muted hover:border-text-muted'}`}
                >
                  I want to Sell
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted" htmlFor="name">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    {...register("name")}
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.name ? 'border-destructive' : 'border-border'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-standard`}
                  />
                </div>
                {errors.name && <p className="text-xs font-bold text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.email ? 'border-destructive' : 'border-border'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-standard`}
                  />
                </div>
                {errors.email && <p className="text-xs font-bold text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted" htmlFor="password">Create Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className={`w-full pl-11 pr-11 py-3 bg-white border ${errors.password ? 'border-destructive' : 'border-border'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-standard`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-bold text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                <span className="bg-white px-4 text-text-muted">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white border border-border rounded-lg flex items-center justify-center gap-3 text-sm font-bold text-text hover:bg-surface transition-standard"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-text-secondary">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
