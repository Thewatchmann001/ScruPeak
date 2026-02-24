import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign, 
  Activity, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B1015] p-6 lg:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
             <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                Registry Active
             </span>
             {user?.kyc_verified && (
               <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> Verified Identity
               </span>
             )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-white tracking-tight"
          >
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{user?.name?.split(' ')[0]}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mt-2 text-lg"
          >
            Monitor your land registry, inquiries, and market trends.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap gap-4"
        >
          <Link to="/marketplace">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:text-white backdrop-blur-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Registry Map
            </Button>
          </Link>

          {(user?.role === 'owner' || user?.role === 'agent') && (
            user?.kyc_verified ? (
              <Link to="/sell">
                <Button className="bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/30 border-none px-6">
                  <FileText className="w-4 h-4 mr-2" />
                  Register Land
                </Button>
              </Link>
            ) : (
              <Link to="/kyc">
                <Button className="bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-500 hover:shadow-orange-600/30 border-none px-6">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Complete KYC
                </Button>
              </Link>
            )
          )}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Registry Views"
          value="4,821"
          trend="+18.5%"
          icon={TrendingUp} 
          color="text-blue-400"
          bg="bg-blue-400/10"
          variants={item}
        />
        <StatCard 
          title="Active Inquiries" 
          value="12"
          trend="+3"
          icon={MessageSquare}
          color="text-orange-400"
          bg="bg-orange-400/10"
          variants={item}
        />
        <StatCard 
          title="Total Value"
          value="Le 850k"
          trend="+Le 45k"
          icon={DollarSign}
          color="text-emerald-400"
          bg="bg-emerald-400/10"
          variants={item}
        />
        <StatCard 
          title="Process Speed"
          value="2.4d"
          trend="-0.5d"
          icon={Clock} 
          color="text-indigo-400"
          bg="bg-indigo-400/10"
          variants={item}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-orange-500" />
               Recent Activity
            </h2>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
              View Audit Log <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="bg-[#121923] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="divide-y divide-slate-800/50">
              <ActivityItem 
                title="Registry Update"
                desc="Property ULID: 01H6...789 was successfully minted on-chain"
                time="2 hours ago"
                icon={ShieldCheck}
                color="text-emerald-400"
                bg="bg-emerald-400/10"
              />
              <ActivityItem 
                title="New Offer Received"
                desc="Proposal for 'Bureh Town Lot #4' from verified buyer"
                time="5 hours ago"
                icon={DollarSign}
                color="text-orange-400"
                bg="bg-orange-400/10"
              />
              <ActivityItem 
                title="Liveness Verified"
                desc="Biometric profile updated and confirmed"
                time="Yesterday"
                icon={Users}
                color="text-blue-400"
                bg="bg-blue-400/10"
              />
               <ActivityItem
                title="Document Uploaded"
                desc="Certified Survey Plan added to registry"
                time="2 days ago"
                icon={FileText}
                color="text-slate-400"
                bg="bg-slate-400/10"
              />
            </div>
            <div className="p-4 bg-slate-900/50 text-center">
               <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Load More History
               </button>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
           {/* Governance / Promotion */}
           <div className="relative group overflow-hidden bg-gradient-to-br from-orange-600 to-orange-800 rounded-3xl p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-orange-600/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="w-24 h-24" />
              </div>
              <h3 className="font-black text-2xl mb-3 leading-tight">Become a Certified Land Agent</h3>
              <p className="text-orange-100 text-sm mb-6 leading-relaxed">Boost your trust score and unlock institutional listing tools for the national registry.</p>
              <Button className="w-full bg-white text-orange-700 hover:bg-orange-50 font-bold py-6 rounded-xl border-none shadow-lg">
                Start Certification
              </Button>
           </div>

           {/* Security Status */}
           <div className="bg-[#121923] rounded-3xl border border-slate-800 p-8 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 Registry Compliance
              </h3>
              <div className="space-y-5">
                <ComplianceItem label="Registry ID Verified" done={true} />
                <ComplianceItem label="Phone SMS Linked" done={true} />
                <ComplianceItem label="Biometric KYC" done={user?.kyc_verified || false} />
                <ComplianceItem label="On-chain Wallet" done={false} />
              </div>
              
              {!user?.kyc_verified && (
                <Link to="/kyc">
                  <Button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-xl py-6">
                    Launch Identity Hub
                  </Button>
                </Link>
              )}

              <div className="mt-8 pt-8 border-t border-slate-800">
                 <div className="flex items-center gap-3 text-slate-500 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>All data encrypted with AES-256 and stored on-chain.</span>
                 </div>
              </div>
           </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, bg, variants }: any) {
  return (
    <motion.div
      variants={variants}
      className="bg-[#121923] p-6 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black text-white mt-2 group-hover:text-orange-500 transition-colors">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl ${bg} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className="mt-6 flex items-center text-xs">
        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-bold flex items-center mr-3">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {trend}
        </span>
        <span className="text-slate-500 font-medium">Growth index</span>
      </div>
    </motion.div>
  );
}

function ActivityItem({ title, desc, time, icon: Icon, color, bg }: any) {
  return (
    <div className="p-5 flex items-start gap-4 hover:bg-slate-800/30 transition-colors group">
      <div className={`p-3 rounded-xl flex-shrink-0 ${bg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-bold text-white">{title}</p>
          <span className="text-[10px] font-bold text-slate-500 uppercase">{time}</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ComplianceItem({ label, done }: { label: string, done: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {done ? (
        <div className="bg-emerald-500/20 p-1 rounded-full">
           <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-slate-700 bg-slate-800/50" />
      )}
    </div>
  );
}
