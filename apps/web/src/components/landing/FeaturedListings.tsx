"use client";

import { useEffect, useState } from "react";
import { ZillowCard } from "./ZillowCard";
import { api } from "@/services/api";
import { Loader2, TrendingUp, ShieldCheck, Map as MapIcon, Zap, Clock, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export function FeaturedListings() {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleViewMarketplace = () => {
    if (!user) {
      navigate("/auth/login?redirect=/marketplace");
    } else {
      navigate("/marketplace");
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get<any>("/land?page_size=6");
        const items = response.data.items || [];
        
        const mappedProperties = items.map((item: any) => ({
          id: item.id,
          image: "https://images.unsplash.com/photo-1500382017468-f049863aab22?w=800&h=600&fit=crop",
          price: Number(item.price),
          location: {
            community: item.title,
            chiefdom: item.region,
            district: item.district,
          },
          size: Number(item.size_sqm),
          sizeUnit: "sqm",
          purpose: item.status === 'available' ? 'Residential' : 'Restricted',
          verificationScore: item.blockchain_verified ? 98 : 88,
          daysOnMarket: Math.floor(Math.random() * 15) + 1,
          isSaved: false,
        }));
        
        setFeaturedProperties(mappedProperties);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return (
      <section className="bg-[#0B1015] py-24 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col justify-center items-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Registry Records...</p>
        </div>
      </section>
    );
  }

  if (!loading && featuredProperties.length === 0) {
    return (
      <section className="bg-[#0B1015] py-24 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6 justify-center">
               <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-[10px] font-black uppercase tracking-widest">Active Inventory</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">Market <span className="text-orange-500">Live</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              The national registry is currently processing new digital submissions.
            </p>
          </div>
          
          <div className="bg-[#121923] rounded-[3rem] p-20 border border-slate-800 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-800">
                <MapIcon className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 uppercase">Registry Queue Empty</h3>
              <p className="text-slate-500 max-w-md mb-10 font-medium">
                No verified listings are available at this moment. You can be the first to register your land in this sector.
              </p>
              <button
                onClick={handleViewMarketplace}
                className="px-12 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 uppercase tracking-widest text-sm"
              >
                Search Full Map
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#0B1015] py-24 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
               <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-[10px] font-black uppercase tracking-widest">Registry Alpha</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-[0.9]">Featured <span className="text-orange-500">Listings</span></h2>
            <p className="text-xl text-slate-400 font-medium">
              Explore the latest verified land parcels secured on the national digital ledger.
            </p>
          </div>

          <Link to="/marketplace" className="hidden md:flex items-center gap-3 text-orange-500 font-black uppercase tracking-widest text-sm hover:text-orange-400 transition-colors group">
             View Entire Registry <TrendingUp className="w-5 h-5 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <ListingStat icon={Zap} label="Growth Rate" value="+12.4%" color="text-emerald-500" />
          <ListingStat icon={ShieldCheck} label="Verification" value="98.2%" color="text-blue-500" />
          <ListingStat icon={Clock} label="Avg Sale Time" value="14 Days" color="text-orange-500" />
          <ListingStat icon={AlertTriangle} label="Dispute Rate" value="0.01%" color="text-slate-500" />
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {featuredProperties.map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
               <ZillowCard {...property} />
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="text-center md:hidden">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-orange-500 transition-all"
          >
            Browse All {featuredProperties.length}+ Properties
          </Link>
        </div>
      </div>
    </section>
  );
}

function ListingStat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-[#121923] border border-slate-800 p-6 rounded-3xl">
       <div className={`w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center ${color} mb-4 border border-white/5`}>
          <Icon size={16} />
       </div>
       <p className="text-2xl font-black text-white tracking-tight">{value}</p>
       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
