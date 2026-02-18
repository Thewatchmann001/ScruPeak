import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  Server,
  Database,
  FileText,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

interface SystemStats {
  users_count: number;
  lands_count: number;
  active_sessions: number;
  pending_kyc: number;
  pending_agents: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats>({
    users_count: 0,
    lands_count: 0,
    active_sessions: 0,
    pending_kyc: 0,
    pending_agents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching stats - in real app connect to /admin/stats endpoint
    const fetchStats = async () => {
      try {
        // const response = await api.get('/admin/stats');
        // setStats(response.data);
        
        // Mock data for now until endpoint is ready
        setStats({
          users_count: 152,
          lands_count: 45,
          active_sessions: 12,
          pending_kyc: 5,
          pending_agents: 3
        });
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500 mt-2">Monitor system health and manage registry resources</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Total Users" 
          value={stats.users_count.toString()} 
          icon={Users} 
          color="text-blue-600" 
          bg="bg-blue-50"
          link="/admin/users"
        />
        <StatCard 
          title="Registered Lands" 
          value={stats.lands_count.toString()} 
          icon={Database} 
          color="text-green-600" 
          bg="bg-green-50"
          link="/admin/lands"
        />
        <StatCard 
          title="Pending KYC" 
          value={stats.pending_kyc.toString()} 
          icon={ShieldCheck} 
          color="text-orange-600" 
          bg="bg-orange-50"
          link="/admin/kyc"
        />
        <StatCard 
          title="Agent Applications" 
          value={stats.pending_agents.toString()} 
          icon={Briefcase} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
          link="/admin/agents"
        />
        <StatCard 
          title="System Health" 
          value="Healthy" 
          icon={Server} 
          color="text-purple-600" 
          bg="bg-purple-50"
        />
      </motion.div>

      {/* Financial & Regulatory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold flex items-center">
               <FileText className="w-5 h-5 mr-2 text-green-600" />
               Tax & Revenue
             </h3>
             <Button variant="outline" size="sm" onClick={() => window.location.href='/admin/tax'}>Manage</Button>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Pending Collections</p>
                <p className="text-2xl font-bold text-green-900">$124,500</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Compliant Lands</p>
                <p className="text-2xl font-bold text-blue-900">85%</p>
              </div>
           </div>
        </Card>

        <Card className="p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold flex items-center">
               <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
               Public Notices
             </h3>
             <Button variant="outline" size="sm" onClick={() => window.location.href='/admin/notices'}>View All</Button>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                 <div>
                    <p className="font-medium text-gray-900">Land SL-092-22</p>
                    <p className="text-xs text-gray-500">Notice expires in 3 days</p>
                 </div>
                 <Button size="sm" variant="ghost" className="text-orange-600">Review</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                 <div>
                    <p className="font-medium text-gray-900">Land SL-092-18</p>
                    <p className="text-xs text-gray-500">Notice period complete</p>
                 </div>
                 <Button size="sm" variant="ghost" className="text-green-600">Approve</Button>
              </div>
           </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Pending Actions
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">KYC Verification Request #{1000 + i}</span>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Recent Logs
          </h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 font-mono bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <div>[INFO] System started successfully</div>
              <div>[INFO] Database connection established</div>
              <div>[WARN] High latency detected in region us-east-1</div>
              <div>[INFO] User registration: joseph@example.com</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, link }: any) {
  const content = (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
