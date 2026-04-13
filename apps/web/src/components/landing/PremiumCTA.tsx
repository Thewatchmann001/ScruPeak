import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PremiumCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#EBF5FF]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
          Register Your Land Today
        </h2>
        <p className="text-lg text-text-secondary mb-10">
          Get started in minutes — fast, legal, and on-chain.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate('/apply-role')}
            className="px-8 py-3.5 bg-primary text-white font-bold rounded-md hover:bg-primary-hover transition-standard shadow-lg shadow-primary/20"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-8 py-3.5 border border-primary text-primary font-bold rounded-md hover:bg-primary/5 transition-standard"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    </section>
  );
};
