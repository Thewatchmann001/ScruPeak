import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Alpha Kamara",
    role: "International Property Investor",
    content: "I've purchased land in three different countries, and LandBiznes's verification process is the most rigorous I've seen. Absolute peace of mind.",
  },
  {
    name: "Sia Jusu",
    role: "Community Leader",
    content: "The digital survey resolved a 10-year boundary dispute in days. It's bringing harmony and investment back to our community.",
  },
  {
    name: "Mark Henderson",
    role: "CEO, Global Land Fund",
    content: "LandBiznes is the infrastructure we've been waiting for. It removes the friction from African land markets entirely.",
  }
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Trusted by Investors & Communities</h2>
          <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale items-center">
             <span className="text-2xl font-black text-white italic">Ministry of Lands</span>
             <span className="text-2xl font-black text-white italic">Global Habitat</span>
             <span className="text-2xl font-black text-white italic">Trust Estates</span>
             <span className="text-2xl font-black text-white italic">SL Real Estate</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-slate-900 border border-white/5 relative"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-orange-500/10" />
              <p className="text-slate-300 text-lg italic mb-8 leading-relaxed relative z-10">
                "{t.content}"
              </p>
              <div>
                <h4 className="text-white font-bold">{t.name}</h4>
                <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mt-1">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-12 rounded-[3rem] bg-orange-600/5 border border-orange-600/20 text-center max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <div>
                <p className="text-4xl font-black text-white">1,200+</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Verified Titles</p>
             </div>
             <div>
                <p className="text-4xl font-black text-white">$14M+</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Value Secured</p>
             </div>
             <div>
                <p className="text-4xl font-black text-white">0</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Court Disputes</p>
             </div>
             <div>
                <p className="text-4xl font-black text-white">10k+</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Active Users</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
