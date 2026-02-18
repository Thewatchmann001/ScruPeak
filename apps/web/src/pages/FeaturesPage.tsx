import { motion } from "framer-motion";
import { Fingerprint, Map, Lock, Zap, Target } from "lucide-react";

const mainFeatures = [
  {
    title: "Immutable Digital Registry",
    description: "Every verified parcel is issued a Permanent Unique Land ID (ULID) recorded on-chain. This provides absolute proof of ownership that cannot be altered or duplicated.",
    icon: Fingerprint,
    details: ["Blockchain Anchoring", "Cryptographic Proofs", "Immutable Audit Logs"]
  },
  {
    title: "AI-Powered Valuation & Search",
    description: "Our proprietary AI engine analyzes historical transaction data, proximity to infrastructure, and community sentiment to provide real-time market insights.",
    icon: Zap,
    details: ["Predictive Analytics", "Deep Search Indexing", "Automated Appraisal"]
  },
  {
    title: "Precision GIS Mapping",
    description: "Satellite-linked GIS survey tools map your land with centimeter-level precision, eliminating boundary disputes once and for all.",
    icon: Map,
    details: ["Satellite Overlay", "Topographic Data", "Automated Border Checks"]
  },
  {
    title: "Secure Legal Escrow",
    description: "We protect both parties with a secure legal escrow system. Funds are only released once all verification checks are complete and ownership is transferred.",
    icon: Lock,
    details: ["Anti-Money Laundering Checks", "Instant Disbursements", "Multi-Sig Security"]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-24">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter"
          >
            The Gold Standard <br /> in <span className="text-orange-500">Land Intelligence</span>
          </motion.h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Discover the technology and processes that make LandBiznes the leading digital land registry and marketplace in the region.
          </p>
        </div>

        <div className="space-y-40">
          {mainFeatures.map((f, i) => (
            <div key={f.title} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 lg:gap-32 items-center`}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-600/10 flex items-center justify-center mb-8 border border-orange-500/20">
                  <f.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">{f.title}</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                  {f.description}
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {f.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-slate-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex-1 w-full"
              >
                <div className="aspect-square lg:aspect-video rounded-[3rem] bg-slate-900 border border-white/5 shadow-3xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <img
                    src={`https://images.unsplash.com/photo-1542601906990-b4d3fb75bb44?auto=format&fit=crop&q=80&w=2664&feature=${f.title.toLowerCase()}`}
                    alt={f.title}
                    className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Target className="w-20 h-20 text-white/10 group-hover:scale-125 transition-transform duration-1000" />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
