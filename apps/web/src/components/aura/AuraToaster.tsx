import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: Math.random().toString(36).substr(2, 9), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));

export const AuraToaster: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-12 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className="glass dark:glass-dark p-4 rounded-2xl shadow-2xl border-white/10 flex items-center gap-4 min-w-[300px]"
          >
            <div className={`p-2 rounded-lg ${
              toast.type === 'success' ? 'bg-teal-500/10 text-teal-500' :
              toast.type === 'error' ? 'bg-primary/10 text-primary' :
              'bg-secondary/10 text-secondary'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              onAnimationComplete={() => removeToast(toast.id)}
              className="absolute bottom-0 left-0 h-1 bg-primary/30"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
