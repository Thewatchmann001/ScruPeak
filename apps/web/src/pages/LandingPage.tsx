import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Map as MapIcon,
  Lock,
  Activity,
  ChevronRight,
  ArrowRight,
  Landmark,
  CheckCircle2,
  Users,
  Search,
  MapPin,
  FileCheck
} from 'lucide-react';
import PremiumHero from '@/components/landing/PremiumHero';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { PremiumCTA } from '@/components/landing/PremiumCTA';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1015] text-white">
      {/* Hero Section */}
      <PremiumHero />

      {/* Trust Strip */}
      <TrustStrip />

      {/* Services Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-6"
            >
              <Landmark size={12} /> Institutional Grade Security
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6"
            >
              The New Standard in <span className="text-orange-500">Land Registry</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg max-w-2xl mx-auto"
            >
              Building a transparent, immutable, and fraud-resistant ecosystem for land ownership in Sierra Leone.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard
              icon={ShieldCheck}
              title="Immutable ULID"
              desc="Every parcel is assigned a Permanent Unique Land ID, cryptographically secured and stored on-chain."
              delay={0.3}
            />
            <ServiceCard
              icon={Activity}
              title="Audit Traceability"
              desc="Complete lineage tracking from original grant to current owner, impossible to alter retrospectively."
              delay={0.4}
            />
            <ServiceCard
              icon={Lock}
              title="Fraud Immunity"
              desc="Multi-signature verification from community elders and licensed surveyors prevents unauthorized claims."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-[#121923] relative">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
               <div className="lg:w-1/2">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-8 leading-tight">
                    How it <span className="text-orange-500">Works</span>
                  </h2>
                  <div className="space-y-10">
                    <ProcessStep
                      num="01"
                      title="Biometric KYC"
                      desc="Verify your identity through our secure 3D liveness check and official document upload."
                    />
                    <ProcessStep
                      num="02"
                      title="Spatial Plotting"
                      desc="Our system validates the parcel coordinates against the national grid and existing claims."
                    />
                    <ProcessStep
                      num="03"
                      title="On-Chain Minting"
                      desc="Once approved, the land record is minted as a digital asset on the Solana blockchain."
                    />
                  </div>
               </div>

               <div className="lg:w-1/2 relative">
                  <div className="relative z-10 rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl">
                     <img
                        src="https://images.unsplash.com/photo-1524813685485-3de5f7aa806c?auto=format&fit=crop&w=800&q=80"
                        alt="Process Visualization"
                        className="w-full h-full object-cover grayscale opacity-60"
                     />
                     <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 via-transparent to-transparent" />
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/20 blur-3xl rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full" />
               </div>
            </div>
         </div>
      </section>

      {/* Marketplace Preview */}
      <div className="bg-[#0B1015]">
        <FeaturedListings />
      </div>

      {/* Global Reach / Stats */}
      <section className="py-24 border-y border-slate-800/50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
               <StatItem label="Verified Parcels" value="12,402" />
               <StatItem label="Registered Users" value="85k+" />
               <StatItem label="Transaction Value" value="Le 450M+" />
               <StatItem label="Dispute Resolution" value="99.9%" />
            </div>
         </div>
      </section>

      <PremiumCTA />
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-10 rounded-[2.5rem] bg-[#121923] border border-slate-800 hover:border-orange-500/50 transition-all group"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-orange-500 mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-xl">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  );
}

function ProcessStep({ num, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="text-5xl font-black text-slate-800 group-hover:text-orange-500 transition-colors duration-500">{num}</div>
      <div>
        <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatItem({ label, value }: any) {
  return (
    <div>
      <p className="text-5xl font-black text-white mb-2 tracking-tighter">{value}</p>
      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}
