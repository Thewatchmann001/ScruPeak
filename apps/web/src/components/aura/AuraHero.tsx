import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const AuraHero: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Magnetic Button logic
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });

  const handleBtnMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

    if (distance < 100) {
      setBtnPos({
        x: (e.clientX - centerX) * 0.4,
        y: (e.clientY - centerY) * 0.4,
      });
    } else {
      setBtnPos({ x: 0, y: 0 });
    }
  };

  const springConfig = { stiffness: 300, damping: 30 };
  const dx = useSpring(btnPos.x, springConfig);
  const dy = useSpring(btnPos.y, springConfig);

  const headline = "Simplified.";
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(headline.slice(0, i));
      i++;
      if (i > headline.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden py-20"
    >
      {/* Animated Gradient Mesh */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15) 0%, transparent 50%)`
          }}
          className="absolute inset-0"
        />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-aura/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-aura/10 rounded-full blur-[120px] animate-float" />
      </div>

      <motion.div
        style={{ y: y1, opacity }}
        className="text-center z-10 px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass dark:glass-dark text-xs font-bold tracking-widest uppercase text-primary mb-8"
        >
          <Sparkles className="w-3 h-3" />
          The Future of Land Systems
        </motion.div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
          <span className="block overflow-hidden h-[1.2em]">
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Spatial Intelligence,
            </motion.span>
          </span>
          <span className="text-gradient inline-block h-[1.2em] relative">
            {displayText}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-[2px] h-[0.8em] bg-primary ml-1 align-middle"
            />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          Transforming property management through AI-driven insights and absolute transparency.
        </motion.p>

        <div
          onMouseMove={handleBtnMouseMove}
          onMouseLeave={() => setBtnPos({ x: 0, y: 0 })}
          className="relative h-20 flex items-center justify-center"
        >
          <motion.button
            ref={buttonRef}
            style={{ x: dx, y: dy }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-8 py-4 aura-gradient rounded-2xl font-bold text-white shadow-2xl shadow-primary/40 flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10">Launch Command Center</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <motion.div
              className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute -inset-4 bg-primary-electric/50 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity rounded-full animate-glow-pulse" />
          </motion.button>
        </div>
      </motion.div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
