import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2, Edit, Shield, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/users');
      // /api/v1/admin/users returns a List[UserResponse] directly, not paginated
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch users', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (userId: string) => {
    try {
      await api.post(`/api/v1/admin/users/${userId}/approve-seller`);
      toast.success('Landowner application approved');
      fetchUsers();
    } catch (error) {
      console.error('Failed to approve landowner', error);
      toast.error('Failed to approve landowner');
    }
  };

  const handleBan = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? 'unban' : 'ban';
    let reason = undefined;
    if (!isBanned) {
      reason = window.prompt('Provide a reason for banning this user:') || undefined;
    }
    
    try {
      await api.put(`/api/v1/users/${userId}/${action}`, null, {
        params: reason ? { reason } : {}
      });
      toast.success(`User ${action}ned successfully`);
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${action} user`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={fetchUsers}>Refresh List</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'agent' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.kyc_verified ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.has_pending_landowner_application && (
                      <button 
                        onClick={() => handleApproveSeller(user.id)} 
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Approve Landowner Application"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleBan(user.id, (user as any).is_banned)} 
                      className={`${(user as any).is_banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                      title={(user as any).is_banned ? "Unban User" : "Ban User"}
                    >
                      {(user as any).is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
