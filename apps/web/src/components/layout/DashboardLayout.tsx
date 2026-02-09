import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Map as MapIcon, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User, 
  ShieldCheck,
  Building,
  Heart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "text-gray-600 hover:bg-gray-100 hover:text-primary"
        )}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-primary")} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Land<span className="text-primary">Biznes</span>
            </span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role} Account</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Main</div>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/marketplace" icon={Building} label="Marketplace" />
          <NavItem to="/map" icon={MapIcon} label="Map View" />
          
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3">Management</div>
          
          {user?.role === 'buyer' && (
             <NavItem to="/dashboard/saved" icon={Heart} label="Saved Properties" />
          )}

          {(user?.role === 'owner' || user?.role === 'agent') && (
            <>
              <NavItem to="/sell" icon={FileText} label="My Listings" />
              <NavItem to="/dashboard/leads" icon={User} label="Leads & Inquiries" />
            </>
          )}

          <NavItem to="/chat" icon={MessageSquare} label="Messages" />
          <NavItem to="/dashboard/documents" icon={ShieldCheck} label="Documents & KYC" />
          
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3">Account</div>
          <NavItem to="/dashboard/settings" icon={Settings} label="Settings" />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-900">Dashboard</span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
