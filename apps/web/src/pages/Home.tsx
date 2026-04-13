import { motion } from 'framer-motion';
import ZillowHero from '@/components/landing/ZillowHero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { FeaturedListings } from '@/components/landing/FeaturedListings';
import { PremiumCTA } from '@/components/landing/PremiumCTA';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <ZillowHero />
      <TrustStrip />

      <FeaturedListings />

      {/* How It Works Section */}
      <motion.section
        {...fadeInUp}
        id="features"
        className="py-24 bg-white border-t border-border"
      >
         <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-text mb-4">How It Works</h2>
             <p className="text-text-secondary max-w-2xl mx-auto">Our secure 6-step process ensures a safe transaction for all parties.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative">
             {/* Desktop Connecting line */}
             <div className="absolute top-10 left-[8%] right-[8%] h-[1px] bg-primary hidden lg:block -z-10 opacity-20" />

             {[
               { step: 1, title: "Verification", desc: "Land is verified and issued a ULID." },
               { step: 2, title: "Agreement", desc: "Buyer and seller agree on transaction." },
               { step: 3, title: "Escrow", desc: "Buyer funds are placed into escrow." },
               { step: 4, title: "Final Checks", desc: "Final verification checks executed." },
               { step: 5, title: "Transfer", desc: "Ownership transfer written on-chain." },
               { step: 6, title: "Release", desc: "Funds are released to seller." }
             ].map((item, idx) => (
               <motion.div
                 key={item.step}
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="flex flex-col items-center text-center"
               >
                  <div className="w-12 h-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mb-4 shadow-lg shadow-primary/20 z-10">
                    {item.step}
                  </div>
                  <h4 className="text-base font-bold text-text mb-2">{item.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed px-2">{item.desc}</p>
               </motion.div>
             ))}
           </div>
         </div>
      </motion.section>

      <PremiumCTA />
    </div>
  );
};

export default Home;
