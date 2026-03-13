import React from 'react';
import { motion } from 'framer-motion';

export const AuraSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    className={`bg-white/5 rounded-xl border border-white/5 ${className}`}
  />
);

export const AuraCardSkeleton: React.FC = () => (
  <div className="glass dark:glass-dark p-6 rounded-2xl border-white/5 space-y-4">
    <div className="flex items-center gap-4">
      <AuraSkeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <AuraSkeleton className="h-4 w-1/3" />
        <AuraSkeleton className="h-3 w-1/4" />
      </div>
    </div>
    <AuraSkeleton className="h-24 w-full" />
    <div className="flex justify-between">
      <AuraSkeleton className="h-8 w-24" />
      <AuraSkeleton className="h-8 w-24" />
    </div>
  </div>
);
