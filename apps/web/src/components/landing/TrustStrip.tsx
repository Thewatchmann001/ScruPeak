"use client";

import { ShieldCheck, Users, ClipboardCheck, Scale } from "lucide-react";
import { motion } from "framer-motion";

export function TrustStrip() {
  const badges = [
    {
      icon: ShieldCheck,
      title: "Verified Survey",
      description: "National grid aligned",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      icon: Users,
      title: "Community Witness",
      description: "Local stakes validated",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: ClipboardCheck,
      title: "History Audit",
      description: "Immutable ownership",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Scale,
      title: "Legal Purity",
      description: "Zero dispute check",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10"
    },
  ];

  return (
    <div className="bg-[#0f172a] py-12 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-4 p-2"
            >
              <div className={`w-12 h-12 rounded-2xl ${badge.bg} ${badge.color} flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5`}>
                <badge.icon size={24} />
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-bold text-white text-sm uppercase tracking-tight">{badge.title}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
