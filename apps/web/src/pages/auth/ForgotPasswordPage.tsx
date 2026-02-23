import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowRight, Loader2, ArrowLeft, MapPin } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1015] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-[#121923] border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
          {isSent ? (
            <div className="text-center space-y-8">
              <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 border border-emerald-500/20">
                  <Mail className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                  Terminal Checked
                </h2>
                <p className="mt-2 text-slate-400 font-medium">
                  We've transmitted reset instructions to your official email.
                </p>
              </div>
              <Link to="/auth/login" className="block">
                  <Button className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl border-none">
                      Return to Access Point
                  </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                  <Link to="/" className="inline-flex items-center gap-2 mb-8">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black text-white uppercase tracking-tighter">Land<span className="text-orange-500">Biznes</span></span>
                  </Link>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    Access Recovery
                  </h2>
                  <p className="mt-2 text-slate-400 font-medium">
                    Initiate protocol to recover your registry credentials.
                  </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/20 border-none group"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Request Key Reset <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Link
                      to="/auth/login"
                      className="inline-flex items-center font-bold text-slate-500 hover:text-white transition-colors uppercase text-xs tracking-widest"
                  >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Access Point
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
