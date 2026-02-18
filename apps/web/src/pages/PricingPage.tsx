import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const tiers = [
  {
    name: "Discovery",
    price: "Free",
    description: "Browse the national land registry and access basic market insights.",
    features: [
      "Access to Interactive Map",
      "Basic Land Search",
      "View Public Listings",
      "Market Price Trends",
      "Community Discussion Access"
    ],
    cta: "Start Browsing",
    popular: false
  },
  {
    name: "Verification Plus",
    price: "Le 1,250",
    description: "Our most popular tier for serious buyers and sellers.",
    features: [
      "Full Title Verification audit",
      "AI-Powered Valuation Report",
      "Satellite GIS Boundary Check",
      "Immutable ULID Issuance",
      "Priority Support",
      "Secure Escrow Protection"
    ],
    cta: "Get Verified",
    popular: true
  },
  {
    name: "Enterprise Registry",
    price: "Contact Us",
    description: "Custom solutions for developers and government agencies.",
    features: [
      "Bulk Land Digitization",
      "API Access for Developers",
      "Dedicated GIS Infrastructure",
      "Advanced Fraud Monitoring",
      "Portfolio Management Tools",
      "Custom Compliance Reports"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter"
          >
            Simple, Transparent <span className="text-orange-500">Security</span>
          </motion.h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose the level of verification and security that fits your investment goals. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-[2.5rem] border ${tier.popular ? 'bg-slate-900 border-orange-500 shadow-3xl shadow-orange-500/10' : 'bg-slate-900/50 border-white/5'}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Trusted
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">{tier.price}</span>
                {tier.price !== "Free" && tier.price !== "Contact Us" && <span className="text-slate-500 ml-2">/parcel</span>}
              </div>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">{tier.description}</p>

              <ul className="space-y-4 mb-10">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-5 h-5 text-orange-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 group ${tier.popular ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                {tier.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
