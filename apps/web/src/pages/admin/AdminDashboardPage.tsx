import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Server,
  Database,
  FileText,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';

interface SystemStats {
  users?: {
    total: number;
    verified: number;
    banned: number;
  };
  lands?: {
    total: number;
    available: number;
    sold: number;
    pending: number;
  };
  transactions?: {
    total_escrows: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/v1/admin/system/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch admin stats', err);
      setError(err.response?.data?.detail || 'Failed to load statistics');
      // Use fallback data
      setStats({
        users: { total: 0, verified: 0, banned: 0 },
        lands: { total: 0, available: 0, sold: 0, pending: 0 },
        transactions: { total_escrows: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

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

  const userData = stats.users || { total: 0, verified: 0, banned: 0 };
  const landData = stats.lands || { total: 0, available: 0, sold: 0, pending: 0 };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500 mt-2">Manage platform users, verify agents/landowners, and monitor system health</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchStats}
            disabled={loading}
          >
            <Activity className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Total Users" 
          value={userData.total.toString()} 
          subtitle={`${userData.verified} verified`}
          icon={Users} 
          color="text-blue-600" 
          bg="bg-blue-50"
          link="/admin/users"
          variants={item}
        />
        <StatCard 
          title="Properties" 
          value={landData.total.toString()} 
          subtitle={`${landData.available} available`}
          icon={Database} 
          color="text-green-600" 
          bg="bg-green-50"
          link="/admin/lands"
          variants={item}
        />
        <StatCard 
          title="Agent Approvals" 
          value="4" 
          subtitle="Pending review"
          icon={Briefcase} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
          link="/admin/agents"
          variants={item}
        />
        <StatCard 
          title="System Status" 
          value="Healthy" 
          subtitle="All systems operational"
          icon={Server} 
          color="text-purple-600" 
          bg="bg-purple-50"
          variants={item}
        />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Verifications */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-500" />
              Pending Verifications
            </h3>
            <div className="space-y-3">
              <VerificationItem 
                type="Agent"
                name="John Adeyemi"
                email="john.adeyemi@email.com"
                status="review"
                link="/admin/agents"
              />
              <VerificationItem 
                type="Landowner"
                name="Maria Conteh"
                email="maria.c@email.com"
                status="review"
                link="/admin/users"
              />
              <VerificationItem 
                type="Agent"
                name="Alastor Kamara"
                email="alastor.k@email.com"
                status="review"
                link="/admin/agents"
              />
              <VerificationItem 
                type="KYC"
                name="Sylvia Sesay"
                email="sylvia.sesay@email.com"
                status="review"
                link="/admin/kyc"
              />
            </div>
            <Link to="/admin/kyc" className="block mt-4">
              <Button variant="outline" className="w-full">
                View All Pending
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Property Listings
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{landData.total}</p>
                <p className="text-xs text-gray-600 mt-1">Total Listed</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{landData.available}</p>
                <p className="text-xs text-gray-600 mt-1">Available</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{landData.pending}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{landData.sold}</p>
                <p className="text-xs text-gray-600 mt-1">Sold</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link to="/admin/agents">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Review Agents
                </Button>
              </Link>
              <Link to="/admin/lands">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Approve Lands
                </Button>
              </Link>
              <Link to="/admin/kyc">
                <Button variant="outline" className="w-full justify-start">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  KYC Reviews
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <h3 className="text-lg font-semibold mb-2">System Health</h3>
            <div className="space-y-2">
              <StatusBadge label="API Server" status="online" />
              <StatusBadge label="Database" status="online" />
              <StatusBadge label="Blockchain" status="online" />
              <StatusBadge label="Email Service" status="online" />
            </div>
          </Card>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Transactions
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Total Escrows</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {stats.transactions?.total_escrows || 0}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Compliant</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">92%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
              Recent Activities
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <ActivityLog text="New agent verified: Abubakarr Jalloh" time="2 hours ago" />
            <ActivityLog text="Land property SL-001-23 approved" time="4 hours ago" />
            <ActivityLog text="KYC submission approved: Fatmata K." time="6 hours ago" />
            <ActivityLog text="System backup completed successfully" time="12 hours ago" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color, 
  bg, 
  link,
  variants
}: any) {
  const content = (
    <motion.div variants={variants}>
      <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </Card>
    </motion.div>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}

function VerificationItem({ type, name, email, status, link }: any) {
  return (
    <Link to={link}>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-l-4 border-yellow-500">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{type} • {email}</p>
        </div>
        <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
          Pending
        </span>
      </div>
    </Link>
  );
}

function StatusBadge({ label, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'online' ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">Online</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-600">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}

function ActivityLog({ text, time }: any) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-gray-700">{text}</p>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
