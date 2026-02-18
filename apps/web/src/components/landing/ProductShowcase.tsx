import { motion } from "framer-motion";
import { Map, ShieldCheck, BarChart3, Fingerprint, ArrowRight } from "lucide-react";

const pillars = [
  {
    title: "Immutable Digital Registry",
    description: "Every verified parcel is issued a Permanent Unique Land ID (ULID) recorded on-chain, ensuring absolute proof of existence.",
    icon: Fingerprint,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "Verifiable Chain of Custody",
    description: "Ownership history is appended only after verified transactions, creating an unalterable audit trail for every acre.",
    icon: ShieldCheck,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    title: "Global Spatial Intelligence",
    description: "Interactive GIS mapping with centimeter-level accuracy prevents boundary disputes before they happen.",
    icon: Map,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    title: "Market Valuation Engine",
    description: "AI-powered algorithms analyze historical data and community demand to provide fair market estimates.",
    icon: BarChart3,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
];

export default function ProductShowcase() {
  return (
    <section className="py-24 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            The Infrastructure of <span className="text-orange-500">Trust</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Our platform integrates blockchain technology, satellite GIS, and AI to provide a comprehensive solution for modern land registries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2rem] bg-slate-950 border border-white/5 hover:border-orange-500/30 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${pillar.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <pillar.icon className={`w-7 h-7 ${pillar.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{pillar.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Platform Interface Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670"
            alt="Platform Dashboard"
            className="w-full h-auto opacity-60 group-hover:scale-[1.02] transition-transform duration-1000"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
             <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center max-w-md mx-4">
                <h4 className="text-2xl font-bold text-white mb-4">Enterprise Grade Infrastructure</h4>
                <p className="text-slate-300 text-sm mb-6">Explore our interactive map and secure registry tools today.</p>
                <button className="bg-white text-slate-950 px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 mx-auto hover:bg-slate-200 transition-colors">
                  Explore Platform <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
