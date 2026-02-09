"use client";

import { useNavigate } from "react-router-dom";

export function PremiumCTA() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 py-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-5xl font-black text-white mb-4">
          Start exploring <br /> trusted land today
        </h2>
        <p className="text-xl text-orange-100 mb-8">
          Join thousands of buyers and sellers verified through LandBiznes
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/explore")}
            className="px-8 py-4 bg-black text-orange-500 font-black text-lg rounded-lg hover:bg-gray-900 transition-all transform hover:scale-105 shadow-lg"
          >
            Explore Land
          </button>
          <button
            onClick={() => navigate("/verify")}
            className="px-8 py-4 border-3 border-white text-white font-black text-lg rounded-lg hover:bg-white hover:text-orange-500 transition-all transform hover:scale-105 shadow-lg"
          >
            Verify Your Land
          </button>
        </div>
      </div>
    </div>
  );
}
