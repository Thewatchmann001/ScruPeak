import React from "react";
import { motion } from "framer-motion";
import { Shield, Search, CheckCircle, TrendingUp } from "lucide-react";

export default function FeatureNarrative() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Narrative Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                Ending the Crisis of <span className="text-orange-500">Uncertainty</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                For too long, land ownership has been plagued by double sales and title fraud.
                We've built the infrastructure to make land a liquid, secure, and verifiable asset.
              </p>
            </div>

            <div className="space-y-6">
              {/* Problem */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Search className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h4 className="text-red-500 font-bold mb-2 uppercase tracking-widest text-xs">The Problem</h4>
                  <p className="text-slate-500 text-sm">
                    Paper-based records leading to disputes, duplicate claims, and blocked investments.
                  </p>
                </div>
              </div>

              {/* Solution */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-widest text-xs">The Solution</h4>
                  <p className="text-slate-400 text-sm">
                    A blockchain-anchored digital registry with AI-powered title verification and satellite mapping.
                  </p>
                </div>
              </div>

              {/* Outcome */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h4 className="text-green-500 font-bold mb-2 uppercase tracking-widest text-xs">The Outcome</h4>
                  <p className="text-slate-400 text-sm">
                    100% dispute-free ownership, instant liquidity, and global investor confidence.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Asymmetric Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-auto px-3 py-1 rounded-full bg-slate-800 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  Live Verification Node
                </div>
              </div>

              <div className="space-y-6">
                <div className="h-4 w-1/3 bg-slate-800 rounded-full" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-orange-500">2.4k</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-widest">ULIDs Issued</span>
                  </div>
                  <div className="h-32 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-blue-400">0</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-widest">Title Conflicts</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-white/5 space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between text-slate-500">
                    <span>TX_HASH: 0x8a2f...3c9e</span>
                    <span className="text-green-500">VERIFIED</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      transition={{ duration: 1.5 }}
                      className="h-full bg-orange-500"
                    />
                  </div>
                  <p className="text-slate-400">ANCHORING PARCEL SL-WA-0092 TO MAINNET...</p>
                </div>
              </div>
            </div>
            {/* Background Orbs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
