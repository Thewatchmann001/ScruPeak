import React from 'react';
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
  MapPin
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'owner' || user?.role === 'agent') && (
            user?.kyc_verified ? (
              <Link to="/sell">
                <Button className="bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
                  <FileText className="w-4 h-4 mr-2" />
                  New Listing
                </Button>
              </Link>
            ) : (
              <Link to="/kyc">
                <Button className="bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
                  <FileText className="w-4 h-4 mr-2" />
                  Verify to List
                </Button>
              </Link>
            )
          )}
          <Link to="/marketplace">
             <Button variant="outline">
              <MapPin className="w-4 h-4 mr-2" />
              Browse Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard 
          title="Total Views" 
          value="1,234" 
          trend="+12%" 
          icon={TrendingUp} 
          color="text-blue-600"
          bg="bg-blue-50"
          variants={item}
        />
        <StatCard 
          title="Active Inquiries" 
          value="8" 
          trend="+2" 
          icon={Users} 
          color="text-purple-600"
          bg="bg-purple-50"
          variants={item}
        />
        <StatCard 
          title="Documents" 
          value="12" 
          trend="All Verified" 
          icon={ShieldCheck} 
          color="text-green-600"
          bg="bg-green-50"
          variants={item}
        />
        <StatCard 
          title="Pending Actions" 
          value="3" 
          trend="Urgent" 
          icon={Clock} 
          color="text-primary"
          bg="bg-slate-50"
          variants={item}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Mock Activity List */}
            <div className="divide-y divide-gray-100">
              <ActivityItem 
                title="Property Listed"
                desc="Green Valley Plot #45 was successfully listed"
                time="2 hours ago"
                icon={FileText}
                bg="bg-blue-100 text-blue-600"
              />
              <ActivityItem 
                title="New Inquiry"
                desc="John Doe sent a message about Sunset Villa"
                time="5 hours ago"
                icon={MessageSquare}
                bg="bg-purple-100 text-purple-600"
              />
              <ActivityItem 
                title="Document Verified"
                desc="Title Deed for Plot #12 verified by Blockchain"
                time="1 day ago"
                icon={ShieldCheck}
                bg="bg-green-100 text-green-600"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Actions & Status */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-primary to-primary-700 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Upgrade to Pro</h3>
              <p className="text-primary-100 text-sm mb-4">Get advanced analytics, priority support, and verified badge.</p>
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-gray-50 border-none">
                Upgrade Now
              </Button>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-4">
                <StatusItem label="Email Verified" done={true} />
                <StatusItem label="Phone Verified" done={true} />
                <StatusItem label="KYC Submitted" done={user?.kyc_verified || false} />
                <StatusItem label="Wallet Connected" done={false} />
              </div>
              
              {!user?.kyc_verified && (
                <Link to="/kyc">
                  <Button variant="outline" className="w-full mt-4">Complete KYC</Button>
                </Link>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color, bg, variants }: any) {
  return (
    <motion.div variants={variants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-600 font-medium flex items-center">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {trend}
        </span>
        <span className="text-gray-400 ml-2">vs last month</span>
      </div>
    </motion.div>
  );
}

function ActivityItem({ title, desc, time, icon: Icon, bg }: any) {
  return (
    <div className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-full flex-shrink-0 ${bg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{desc}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

function StatusItem({ label, done }: { label: string, done: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {done ? (
        <ShieldCheck className="w-5 h-5 text-green-500" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
      )}
    </div>
  );
}

// Import helper icons
import { MessageSquare } from 'lucide-react';
