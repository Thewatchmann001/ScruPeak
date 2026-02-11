"use client";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PremiumCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Card - Register */}
        <div className="relative overflow-hidden rounded-3xl bg-[#3C4130] p-10 md:p-14 text-white min-h-[400px] flex flex-col justify-center shadow-xl">
          {/* Background Pattern/Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-black mb-2">Register Your Land</h3>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6 font-semibold">MINIMAL LATTICE</p>
            
            <p className="text-gray-300 text-lg mb-8 max-w-md">
              Secure your family's future by digitizing your land titles today. Fast, legal, and hassle-free.
            </p>
            
            <button
              onClick={() =>
                user ? navigate("/kyc") : navigate("/auth/login?redirect=/kyc")
              }
              className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg inline-block"
            >
              Get Registered
            </button>
          </div>
          
          {/* Decorative Plant Image (Optional/Placeholder) */}
          <div className="absolute bottom-0 right-10 w-32 h-32 opacity-20 pointer-events-none">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
             </svg>
          </div>
        </div>

        {/* Right Card - Invest */}
        <div className="relative overflow-hidden rounded-3xl bg-orange-500 p-10 md:p-14 text-white min-h-[400px] flex flex-col justify-center shadow-xl group">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" 
              alt="Luxury Home" 
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 to-transparent" />
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-black mb-4">Invest in Salone</h3>
            
            <p className="text-gray-100 text-lg mb-8 max-w-md font-medium">
              Explore verified investment opportunities in residential, commercial, and agricultural sectors.
            </p>
            
            <button
              onClick={() => navigate("/marketplace")}
              className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg inline-block"
            >
              View Marketplace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
