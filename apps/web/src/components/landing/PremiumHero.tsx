import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowDown, Shield, MapPin, Target, CreditCard } from "lucide-react";
export default function PremiumHero() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [landType, setLandType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    if (landType) params.append("type", landType);
    if (purpose) params.append("purpose", purpose);
    if (budget) params.append("budget", budget);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/images/hero.png" 
          alt="Land Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Enhanced Background with Layered Effects */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/80 to-gray-950/90" />
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px),
              linear-gradient(180deg, rgba(249,115,22,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-orange-600/3 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-2/3 left-1/3 w-48 h-48 bg-orange-400/7 rounded-full blur-2xl animate-float-slow" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-32 pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 lg:mb-16 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6 lg:mb-8">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
                Verified Land Marketplace
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-4 lg:mb-6 leading-tight">
              Buy <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Verified Land</span>
              <br className="hidden lg:block" /> in Sierra Leone — Without Fear
            </h1>

            {/* Subheading */}
            <p className="text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto mb-8 lg:mb-12">
              Verified family ownership. Survey plans confirmed. Community witnessed. Escrow-protected payments.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 lg:mb-12 max-w-4xl mx-auto animate-slide-up-delayed">
            {[
              { icon: Shield, label: "No Double Sales", color: "text-green-500" },
              { icon: MapPin, label: "Survey Confirmed", color: "text-blue-500" },
              { icon: Target, label: "Community Verified", color: "text-purple-500" },
              { icon: CreditCard, label: "Escrow Protected", color: "text-orange-500" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 lg:p-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color.replace('text-', '')}/10`}>
                  <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.color}`} />
                </div>
                <span className="text-sm lg:text-base font-medium text-white">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Search Bar - MAINTAINED AS REQUESTED */}
          <div className="max-w-5xl mx-auto mb-8 lg:mb-12 animate-slide-up-delayed-2">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-1">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 lg:gap-3 p-4 lg:p-5">
                {/* District */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="District/Chiefdom"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 lg:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>

                {/* Land Type */}
                <div className="relative">
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    className="w-full px-4 py-3 lg:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Land Type</option>
                    <option value="residential" className="bg-gray-900">Residential</option>
                    <option value="commercial" className="bg-gray-900">Commercial</option>
                    <option value="agricultural" className="bg-gray-900">Agricultural</option>
                    <option value="industrial" className="bg-gray-900">Industrial</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Purpose */}
                <div className="relative">
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 lg:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Purpose</option>
                    <option value="build" className="bg-gray-900">Build Home</option>
                    <option value="invest" className="bg-gray-900">Invest</option>
                    <option value="farm" className="bg-gray-900">Farm</option>
                    <option value="develop" className="bg-gray-900">Develop</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Budget */}
                <div className="relative">
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 lg:py-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Budget (Le)</option>
                    <option value="0-25000" className="bg-gray-900">Under Le25K</option>
                    <option value="25000-50000" className="bg-gray-900">Le25K - Le50K</option>
                    <option value="50000-100000" className="bg-gray-900">Le50K - Le100K</option>
                    <option value="100000+" className="bg-gray-900">Le100K+</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="group px-6 py-3 lg:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>Explore</span>
                </button>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-delayed-3">
            <button
              onClick={() => navigate('/auth/register')}
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center gap-3"
            >
              <span>Get Started</span>
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
            
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-400 font-medium tracking-wider">SCROLL</span>
          <ArrowDown className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes gridMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 50px 50px;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(30px) scale(1.03);
          }
        }
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.02);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        .animate-slide-up-delayed {
          animation: slide-up 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-2 {
          animation: slide-up 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        .animate-slide-up-delayed-3 {
          animation: slide-up 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f97316, #fb923c);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}