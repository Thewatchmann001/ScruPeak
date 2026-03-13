import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Map as MapIcon,
  Database,
  ShieldCheck,
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Command,
  Activity,
  ChevronRight,
  Sun,
  Moon,
  User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Activity, label: 'Command Center', path: '/command-center' },
  { icon: MapIcon, label: 'Marketplace', path: '/marketplace' },
  { icon: Database, label: 'Registry', path: '/registry' },
  { icon: ShieldCheck, label: 'Verification', path: '/kyc' },
  { icon: MessageSquare, label: 'Messages', path: '/chat' },
];

export const AuraLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('aura-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('aura-theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${theme} bg-background text-foreground selection:bg-primary/30`}>
      {/* Sticky Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass dark:glass-dark border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg aura-gradient flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
              SP
            </div>
            <span className="font-black text-xl tracking-tight hidden md:block">
              SCRU<span className="text-primary">PEAK</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 glass dark:glass-dark rounded-full text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/20 bg-white/5 font-mono text-[10px]">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <div className="w-8 h-8 rounded-full aura-gradient border-2 border-white/20 shadow-lg" />
        </div>
      </header>

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="hidden md:flex flex-col border-r border-white/5 glass dark:glass-dark relative z-40"
        >
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all group relative overflow-hidden ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary shadow-inner shadow-primary/5'
                    : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  location.pathname === item.path ? 'text-primary' : ''
                }`} />
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 aura-gradient rounded-r-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground w-full transition-all group">
              <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-45 transition-transform" />
              {isSidebarOpen && <span className="font-medium">Settings</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto pb-24">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 glass dark:glass-dark border-t border-white/10 md:hidden flex items-center justify-around px-2">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </nav>

      {/* Bottom Status Bar (Desktop) */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 glass dark:glass-dark border-t border-white/10 hidden md:flex items-center justify-between px-6 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
            />
            <span>System Operational</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-white/20">/</span>
            <span>API Gateway: 12ms</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-white/20">/</span>
            <span>Spatial Engine: Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>v2.4.0-aura</span>
          <Activity className="w-3 h-3 text-primary animate-pulse-slow" />
        </div>
      </footer>

      {/* Command Palette Placeholder */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommandPaletteOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="relative w-full max-w-xl glass dark:glass-dark rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-4 flex items-center gap-4 border-b border-white/10">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground/50"
                />
                <button onClick={() => setCommandPaletteOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 font-bold">Quick Navigation</div>
                <div className="grid gap-1">
                  {navItems.map(item => (
                    <button key={item.path} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group text-left">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-black/10 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>Navigate with ↑↓ and Enter</span>
                <span className="flex items-center gap-1">Close with <kbd className="px-1 border border-white/20 rounded">ESC</kbd></span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
