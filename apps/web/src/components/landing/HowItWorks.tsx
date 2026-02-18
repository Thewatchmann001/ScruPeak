import React from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, CreditCard, UserCheck, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Verify Title",
    desc: "Our AI audits the historical title documents and cross-references with community oral history.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Digital Survey",
    desc: "Satellite-linked GIS survey maps boundaries with centimeter-level precision.",
    icon: Search,
  },
  {
    step: "03",
    title: "Chain of Custody",
    desc: "Land is issued a ULID and anchored to the blockchain registry.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    title: "Escrow Deposit",
    desc: "Buyer funds are held in a secure legal escrow account.",
    icon: CreditCard,
  },
  {
    step: "05",
    title: "Final Verification",
    desc: "Identity verification (KYC) of all parties is completed.",
    icon: UserCheck,
  },
  {
    step: "06",
    title: "Ownership Transfer",
    desc: "Registry is updated instantly and funds are released.",
    icon: CheckCircle2,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The Road to <span className="text-orange-500">Conflict-Free</span> Land</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Our 6-step rigorous verification and transaction process ensures absolute security for buyers and sellers.</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-[4.5rem] left-0 w-full h-0.5 bg-slate-800 hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center mb-6 group-hover:border-orange-500/50 transition-all shadow-xl ring-4 ring-slate-900">
                  <s.icon className="w-6 h-6 text-orange-500" />
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl font-black text-white/5 -z-10 group-hover:text-orange-500/10 transition-colors">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-500 text-[10px] leading-relaxed max-w-[120px]">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
