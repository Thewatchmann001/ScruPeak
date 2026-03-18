import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, DollarSign } from "lucide-react";

export default function PremiumHero() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [landType, setLandType] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    if (landType) params.append("type", landType);
    if (budget) params.append("budget", budget);
    navigate(`/marketplace?${params.toString()}`);
  };

  return (
    <section className="relative w-full pt-20 pb-32 bg-white overflow-hidden">
      {/* Subtle blue gradient at top */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#F0F7FF] to-white pointer-events-none" />

      <div className="relative container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-text mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Find Verified Land in Sierra Leone
        </h1>
        <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Every listing surveyed, community-confirmed, and recorded on-chain.
        </p>

        {/* Prominent Search Bar */}
        <div className="max-w-4xl mx-auto mb-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
          <div className="bg-white rounded-[12px] shadow-xl p-2 border border-border flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="District or Chiefdom"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-text placeholder-text-muted focus:outline-none"
              />
            </div>

            <div className="h-8 w-px bg-border hidden md:block" />

            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary">
                <Home className="w-5 h-5" />
              </div>
              <select
                value={landType}
                onChange={(e) => setLandType(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-text appearance-none focus:outline-none"
              >
                <option value="">Land Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>

            <div className="h-8 w-px bg-border hidden md:block" />

            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Budget (Le)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-text placeholder-text-muted focus:outline-none"
              />
            </div>

            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {["Residential", "Commercial", "Agricultural", "Industrial"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setLandType(type.toLowerCase());
                handleSearch();
              }}
              className="px-5 py-2 bg-surface border border-border rounded-full text-sm font-medium text-text-secondary hover:border-primary hover:text-primary hover:bg-white transition-all shadow-sm"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
