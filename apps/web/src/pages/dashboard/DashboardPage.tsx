import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  MessageSquare,
  ArrowDownRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();

  // Redirect unverified users or handle appropriately
  if (!user?.kyc_verified) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-yellow-900 mb-2">Verification Required</h2>
              <p className="text-yellow-800 mb-4">You need to complete KYC verification to access the dashboard and list properties.</p>
              <Link to="/kyc">
                <Button className="bg-yellow-600 text-white hover:bg-yellow-700">
                  Complete KYC Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render different dashboards based on role
  if (user?.role === 'owner') {
    return <LandownerDashboard user={user} />;
  } else if (user?.role === 'agent') {
    return <AgentDashboard user={user} />;
  }

  // Default fallback
  return <DefaultDashboard user={user} />;
}

function LandownerDashboard({ user }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Landowner Dashboard</h1>
          <p className="text-text-secondary">Welcome, <span className="text-text font-semibold">{user?.name}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/sell">
            <Button className="h-11 px-6 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard">
              <FileText className="w-4 h-4 mr-2" />
              List New Property
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline" className="h-11 px-6 border-border font-bold text-text hover:bg-surface transition-standard">
              <MapPin className="w-4 h-4 mr-2" />
              Browse Listings
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="bg-success-light border border-success rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
        <span className="text-sm font-medium text-success">Your account is verified and active</span>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Active Listings" 
          value="5" 
          trend="+2" 
          trendType="up"
          icon={FileText} 
          variants={item}
        />
        <StatCard 
          title="Inquiries" 
          value="12" 
          trend="+4" 
          trendType="up"
          icon={Users} 
          variants={item}
        />
        <StatCard 
          title="Documents" 
          value="8" 
          trend="100%"
          trendType="neutral"
          icon={ShieldCheck} 
          variants={item}
        />
        <StatCard 
          title="Pending Actions" 
          value="2" 
          trend="-1"
          trendType="down"
          icon={Clock} 
          variants={item}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Recent Activity</h2>
            <button className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              <ActivityItem 
                title="Property Listed"
                desc="Green Valley Plot #45 was successfully listed"
                time="2 hours ago"
                icon={FileText}
                status="success"
              />
              <ActivityItem 
                title="New Inquiry"
                desc="John Doe sent a message about Sunset Villa"
                time="5 hours ago"
                icon={MessageSquare}
                status="info"
              />
              <ActivityItem 
                title="Document Verified"
                desc="Title Deed for Plot #12 verified by Blockchain"
                time="1 day ago"
                icon={ShieldCheck}
                status="success"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
            <h3 className="font-bold text-text mb-6">Account Status</h3>
            <div className="space-y-5">
              <StatusItem label="Email Verified" done={true} />
              <StatusItem label="Phone Verified" done={true} />
              <StatusItem label="KYC Verified" done={true} />
              <StatusItem label="Wallet Connected" done={false} />
            </div>
          </div>

          <div className="bg-surface rounded-xl p-8 border border-border">
            <h3 className="font-bold text-lg text-text mb-2">Need Help?</h3>
            <p className="text-text-secondary text-sm mb-6">Contact our support team for assistance with your properties.</p>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDashboard({ user }: any) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Agent Dashboard</h1>
          <p className="text-text-secondary">Welcome, <span className="text-text font-semibold">{user?.name}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/marketplace">
            <Button className="h-11 px-6 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard">
              <MapPin className="w-4 h-4 mr-2" />
              Find Properties
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="bg-success-light border border-success rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
        <span className="text-sm font-medium text-success">You are verified and can facilitate transactions</span>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Active Listings" 
          value="8" 
          trend="+3" 
          trendType="up"
          icon={FileText} 
          variants={item}
        />
        <StatCard 
          title="Pending Transactions" 
          value="5" 
          trend="+1" 
          trendType="up"
          icon={Users} 
          variants={item}
        />
        <StatCard 
          title="Commissions Earned" 
          value="$2,450" 
          trend="+15%"
          trendType="up"
          icon={TrendingUp} 
          variants={item}
        />
        <StatCard 
          title="Pending Approvals" 
          value="1" 
          trend="0"
          trendType="neutral"
          icon={Clock} 
          variants={item}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Assigned Properties</h2>
            <button className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              <ActivityItem 
                title="Valley Estate - 45 plots"
                desc="Commission: 2% | Status: Active Sales"
                time="Listed 3 weeks ago"
                icon={FileText}
                status="success"
              />
              <ActivityItem 
                title="Sunset Villas - 12 units"
                desc="Commission: 3% | Status: Pending Verification"
                time="Listed 1 week ago"
                icon={MessageSquare}
                status="info"
              />
              <ActivityItem 
                title="Downtown Complex - 8 apartments"
                desc="Commission: 2.5% | Status: Active Sales"
                time="Listed 2 days ago"
                icon={ShieldCheck}
                status="success"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
            <h3 className="font-bold text-text mb-6">Account Status</h3>
            <div className="space-y-5">
              <StatusItem label="Email Verified" done={true} />
              <StatusItem label="Phone Verified" done={true} />
              <StatusItem label="KYC Verified" done={true} />
              <StatusItem label="Bank Details" done={true} />
            </div>
          </div>

          <div className="bg-surface rounded-xl p-8 border border-border">
            <h3 className="font-bold text-lg text-text mb-2">Performance</h3>
            <p className="text-text-secondary text-sm mb-6">You've completed 12 transactions this year.</p>
            <Button variant="outline" className="w-full">
              View Statistics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultDashboard({ user }: any) {
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
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Dashboard</h1>
          <p className="text-text-secondary">Welcome back, <span className="text-text font-semibold">{user?.name}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(user?.role === 'owner' || user?.role === 'agent') && (
            user?.kyc_verified ? (
              <Link to="/sell">
                <Button className="h-11 px-6 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard">
                  <FileText className="w-4 h-4 mr-2" />
                  New Listing
                </Button>
              </Link>
            ) : (
              <Link to="/kyc">
                <Button className="h-11 px-6 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-standard">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify to List
                </Button>
              </Link>
            )
          )}
          <Link to="/marketplace">
             <Button variant="outline" className="h-11 px-6 border-border font-bold text-text hover:bg-surface transition-standard">
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Total Views" 
          value="1,234" 
          trend="+12%" 
          trendType="up"
          icon={TrendingUp} 
          variants={item}
        />
        <StatCard 
          title="Active Inquiries" 
          value="8" 
          trend="+2" 
          trendType="up"
          icon={Users} 
          variants={item}
        />
        <StatCard 
          title="Documents" 
          value="12" 
          trend="100%"
          trendType="neutral"
          icon={ShieldCheck} 
          variants={item}
        />
        <StatCard 
          title="Pending Actions" 
          value="3" 
          trend="-1"
          trendType="down"
          icon={Clock} 
          variants={item}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Recent Activity</h2>
            <button className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              <ActivityItem 
                title="Property Listed"
                desc="Green Valley Plot #45 was successfully listed"
                time="2 hours ago"
                icon={FileText}
                status="success"
              />
              <ActivityItem 
                title="New Inquiry"
                desc="John Doe sent a message about Sunset Villa"
                time="5 hours ago"
                icon={MessageSquare}
                status="info"
              />
              <ActivityItem 
                title="Document Verified"
                desc="Title Deed for Plot #12 verified by Blockchain"
                time="1 day ago"
                icon={ShieldCheck}
                status="success"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
           <div className="bg-surface rounded-xl p-8 border border-border">
              <h3 className="font-bold text-lg text-text mb-2">Upgrade to Pro</h3>
              <p className="text-text-secondary text-sm mb-6">Get advanced analytics, priority support, and a verified badge on your profile.</p>
              <Button className="w-full h-11 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-standard">
                Upgrade Now
              </Button>
           </div>

           <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
              <h3 className="font-bold text-text mb-6">Verification Status</h3>
              <div className="space-y-5">
                <StatusItem label="Email Verified" done={true} />
                <StatusItem label="Phone Verified" done={true} />
                <StatusItem label="KYC Submitted" done={user?.kyc_verified || false} />
                <StatusItem label="Wallet Connected" done={false} />
              </div>
              
              {!user?.kyc_verified && (
                <Link to="/kyc" className="block mt-8">
                  <Button variant="outline" className="w-full h-11 border-primary text-primary font-bold hover:bg-primary/5 transition-standard">
                    Complete KYC
                  </Button>
                </Link>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendType, icon: Icon, variants }: any) {
  return (
    <motion.div variants={variants} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-card-hover transition-standard">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-surface rounded-lg border border-border">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
          trendType === 'up' ? 'bg-success-light text-success' :
          trendType === 'down' ? 'bg-red-50 text-red-600' :
          'bg-surface text-text-secondary'
        }`}>
          {trendType === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
          {trendType === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-text tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}

function ActivityItem({ title, desc, time, icon: Icon, status }: any) {
  return (
    <div className="p-5 flex items-start gap-4 hover:bg-surface transition-standard cursor-default group">
      <div className={`p-2.5 rounded-lg flex-shrink-0 transition-standard ${
        status === 'success' ? 'bg-success-light text-success group-hover:bg-success group-hover:text-white' :
        'bg-[#E3F2FD] text-[#1565C0] group-hover:bg-[#1565C0] group-hover:text-white'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="text-sm text-text-secondary truncate">{desc}</p>
      </div>
      <span className="text-xs font-semibold text-text-muted whitespace-nowrap">{time}</span>
    </div>
  );
}

function StatusItem({ label, done }: { label: string, done: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {done ? (
        <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-border" />
      )}
    </div>
  );
}
