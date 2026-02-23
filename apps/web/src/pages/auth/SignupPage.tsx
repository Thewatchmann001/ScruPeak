import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, MapPin } from 'lucide-react';

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
      toast.success('Registry Account Created');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Registration failed. System error.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1015] px-4 py-12">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-[#121923] border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
          <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-2 mb-8">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                    <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black text-white uppercase tracking-tighter">Land<span className="text-orange-500">Biznes</span></span>
              </Link>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                Registry Enrollment
              </h2>
              <p className="mt-2 text-slate-400 font-medium">
                Join the secure national digital land registry.
              </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Identity Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    placeholder="name@agency.gov"
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Credentials</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 pr-12 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.password.message}</p>}
                </div>
              </div>
            </div>
            
            <input type="hidden" value="buyer" {...register("role")} />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/20 border-none mt-4 group"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Registry Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-800 flex flex-col gap-4">
             <p className="text-center text-sm text-slate-400 font-medium">
               Already enrolled in the system?{' '}
               <Link to="/auth/login" className="text-white font-black hover:text-orange-500 transition-colors">
                 Authenticate Access
               </Link>
             </p>
             <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Immutable data protection active
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
