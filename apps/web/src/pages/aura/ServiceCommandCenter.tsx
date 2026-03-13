import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  Database,
  Globe,
  RefreshCw,
  Terminal,
  Zap,
  Server,
  Cloud,
  Box
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const services = [
  { id: 'api-gateway', name: 'API Gateway', status: 'healthy', cpu: 12, mem: 245, type: 'Edge' },
  { id: 'backend', name: 'Core Backend', status: 'healthy', cpu: 34, mem: 1024, type: 'System' },
  { id: 'ai-service', name: 'AI Engine', status: 'healthy', cpu: 89, mem: 4096, type: 'Intelligence' },
  { id: 'spatial-service', name: 'Spatial Intelligence', status: 'degraded', cpu: 45, mem: 2048, type: 'Spatial' },
  { id: 'auth-server', name: 'Auth Node', status: 'healthy', cpu: 5, mem: 512, type: 'Security' },
];

const generateData = () => Array.from({ length: 20 }, (_, i) => ({
  time: i,
  value: Math.floor(Math.random() * 100),
}));

export const ServiceCommandCenter: React.FC = () => {
  const [data, setData] = useState(generateData());
  const [restarting, setRestarting] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, value: Math.floor(Math.random() * 100) }]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = (id: string) => {
    setRestarting(id);
    setTimeout(() => setRestarting(null), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Service Command Center</h1>
          <p className="text-muted-foreground">Real-time telemetry and microservice orchestration.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 glass dark:glass-dark rounded-full text-xs font-mono">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 rounded-full bg-teal-500"
            />
            LIVE UPDATES
          </div>
          <button className="px-4 py-2 aura-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Global Restart
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Requests', value: '1.2M', icon: Activity, trend: '+12.5%' },
          { label: 'Avg Latency', value: '24ms', icon: Zap, trend: '-2.1%' },
          { label: 'Uptime', value: '99.99%', icon: Globe, trend: 'Stable' },
          { label: 'Compute Nodes', value: '12', icon: Cpu, trend: 'Active' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass dark:glass-dark p-6 rounded-2xl border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stat.trend.startsWith('+') ? 'bg-teal-500/10 text-teal-500' : 'bg-primary/10 text-primary'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-2xl font-black mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Active Microservices
          </h2>
          <div className="grid gap-4">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass dark:glass-dark p-4 rounded-2xl border-white/5 group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl aura-gradient flex items-center justify-center text-white shadow-lg ${
                      service.status === 'degraded' ? 'hue-rotate-90' : ''
                    }`}>
                      {service.id === 'ai-service' ? <Cloud className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {service.name}
                        <span className={`w-2 h-2 rounded-full ${
                          service.status === 'healthy' ? 'bg-teal-500' : 'bg-primary animate-pulse'
                        }`} />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">{service.type} • {service.mem}MB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold font-mono">{service.cpu}% CPU</div>
                      <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${service.cpu}%` }}
                          className="h-full aura-gradient"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestart(service.id)}
                      className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${
                        restarting === service.id ? 'animate-spin' : ''
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Latency
          </h2>
          <div className="glass dark:glass-dark p-6 rounded-3xl border-white/5 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Terminal Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          Live Logs
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 font-mono text-xs overflow-hidden h-64 relative">
          <div className="space-y-2 opacity-70">
            <div className="text-teal-500">[SYSTEM] Starting deployment cycle v2.4.0-aura...</div>
            <div className="text-primary">[AI-SERVICE] Model training shard #42 loaded into memory.</div>
            <div className="text-white/40">[BACKEND] Listening on port 8000 (HTTP/2)</div>
            <div className="text-white/40">[GATEWAY] Health check propagation: 5/5 nodes online.</div>
            <div className="text-teal-500">[SYSTEM] Optimized garbage collection triggered.</div>
            <div className="text-primary-electric">[SPATIAL] Indexing region: Sierra Leone - Freetown Zone A</div>
            <div className="text-white/40">[AUTH] Token refresh issued for user: aura_prime</div>
            <div className="animate-pulse text-white">_</div>
          </div>
          <div className="absolute top-4 right-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest opacity-50">Streaming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCommandCenter;
