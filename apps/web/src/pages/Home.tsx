import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuraHero } from '@/components/aura/AuraHero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { PremiumCTA } from '@/components/landing/PremiumCTA';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen space-y-24">
      <AuraHero />

      <motion.div {...fadeInUp}>
        <TrustStrip />
      </motion.div>

      {/* Secure Land Registration Services Section */}
      <motion.section
        {...fadeInUp}
        className="py-32 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 origin-right -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">Secure Land Registration Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bringing transparency and efficiency to land ownership through cutting-edge technology and legal expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass dark:glass-dark p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all group border-white/5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform aura-gradient shadow-lg shadow-primary/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Immutable ULID</h3>
              <p className="text-slate-600 leading-relaxed">
                Every verified parcel is issued a Permanent Unique Land ID recorded on-chain, ensuring absolute proof of existence.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 group">
               <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Verifiable History</h3>
              <p className="text-slate-600 leading-relaxed">
                Ownership history is appended only after verified transactions, creating a transparent and unalterable audit trail.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 group">
               <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Fraud Resistance</h3>
              <p className="text-slate-600 leading-relaxed">
                Blockchain anchoring prevents conflict and duplicate claims, making land-grabbing technically impossible.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
             <button
               onClick={() => navigate('/auth/login?redirect=/kyc')}
               className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-95">
               Register Your Land Now
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
               </svg>
             </button>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        {...fadeInUp}
        className="py-32 bg-white overflow-hidden"
      >
         <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
             <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">How It Works</h2>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">Our secure 6-step verification and escrow process ensures a safe transaction for all parties.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative">
             {/* Dynamic Connecting line for desktop */}
             <div className="absolute top-10 left-[8%] right-[8%] h-[2px] bg-slate-100 hidden lg:block -z-10">
               <motion.div
                 initial={{ width: 0 }}
                 whileInView={{ width: '100%' }}
                 viewport={{ once: true }}
                 transition={{ duration: 1.5, ease: "easeInOut" }}
                 className="h-full bg-gradient-to-r from-primary/20 via-primary to-primary/20"
               />
             </div>

             {[
               { step: 1, title: "Verification", desc: "Land is verified and issued a ULID." },
               { step: 2, title: "Agreement", desc: "Buyer and seller agree on transaction." },
               { step: 3, title: "Escrow", desc: "Buyer funds are placed into ScruPeak escrow." },
               { step: 4, title: "Final Checks", desc: "Final verification checks are executed." },
               { step: 5, title: "Transfer", desc: "Ownership transfer is written on-chain." },
               { step: 6, title: "Release", desc: "Funds are released to seller." }
             ].map((item, idx) => (
               <motion.div
                 key={item.step}
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="flex flex-col items-center text-center group"
               >
                  <div className="w-20 h-20 rounded-3xl glass dark:glass-dark border border-white/5 text-slate-400 group-hover:border-primary group-hover:text-primary font-black text-2xl flex items-center justify-center mb-6 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-500 relative z-10">
                    {item.step}
                    <div className="absolute inset-0 rounded-3xl bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-500 -z-10" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed px-2">{item.desc}</p>
               </motion.div>
             ))}
           </div>
         </div>
      </motion.section>

      <div className="bg-slate-50">
        <FeaturedListings />
      </div>
      <PremiumCTA />
    </div>
  );
};

export default Home;
