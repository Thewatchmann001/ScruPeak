"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Shield,
  Mail,
  User,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const SUPER_ADMIN_EMAIL = "josephemsamah@gmail.com";

const adminRoles = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full system access, can manage all admins and users",
    permissions: [
      "View all data",
      "Manage admins",
      "Verify documents",
      "Verify agents",
      "Manage KYC",
      "View reports",
      "System settings",
    ],
  },
  {
    id: "document-verifier",
    name: "Document Verifier",
    description: "Can verify land documents and perform AI analysis",
    permissions: [
      "Verify documents",
      "Review documents",
      "AI analysis",
      "Flag issues",
    ],
  },
  {
    id: "kyc-officer",
    name: "KYC Officer",
    description: "Can verify land owner and agent KYC applications",
    permissions: ["Verify KYC", "Review documents", "Approve/Reject", "View reports"],
  },
  {
    id: "agent-verifier",
    name: "Agent Verifier",
    description: "Can verify and manage real estate agents",
    permissions: ["Verify agents", "View credentials", "Approve/Reject", "Flag issues"],
  },
  {
    id: "support",
    name: "Support Officer",
    description: "Can respond to user inquiries and support tickets",
    permissions: ["View tickets", "Respond to users", "Manage complaints"],
  },
];

const currentAdmins = [
  {
    id: 1,
    name: "Joseph Emsamah",
    email: "josephemsamah@gmail.com",
    role: "super-admin",
    joinedDate: "January 1, 2025",
    status: "active",
    isSuperAdmin: true,
  },
  {
    id: 2,
    name: "Amara Conteh",
    email: "amara.conteh@landbiznes.com",
    role: "document-verifier",
    joinedDate: "January 10, 2026",
    status: "active",
    isSuperAdmin: false,
  },
  {
    id: 3,
    name: "Mohamed Hassan",
    email: "mohamed.hassan@landbiznes.com",
    role: "kyc-officer",
    joinedDate: "January 15, 2026",
    status: "active",
    isSuperAdmin: false,
  },
];

export default function AdminManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState(currentAdmins);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", name: "", role: "document-verifier" });
  const [loading, setLoading] = useState(false);

  // Only allow super admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <Card className="p-6 bg-yellow-500/5 border border-yellow-500/20 max-w-md">
          <h2 className="font-bold text-yellow-700 mb-2">Access Restricted</h2>
          <p className="text-sm text-yellow-600">
            Only the super admin ({SUPER_ADMIN_EMAIL}) can manage admin roles.
          </p>
        </Card>
      </div>
    );
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const newAdmin = {
        id: admins.length + 1,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        joinedDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        status: "active",
        isSuperAdmin: false,
      };

      setAdmins([...admins, newAdmin]);
      setFormData({ email: "", name: "", role: "document-verifier" });
      setShowAddForm(false);
      setLoading(false);
    }, 1000);
  };

  const handleRemoveAdmin = (id: number) => {
    if (id === 1) {
      alert("Cannot remove the super admin");
      return;
    }

    if (window.confirm("Are you sure you want to remove this admin?")) {
      setAdmins(admins.filter((admin) => admin.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage admin accounts and assign roles
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Add Admin Form */}
        {showAddForm && (
          <Card className="p-6 border border-primary/20 bg-primary/5">
            <h2 className="font-bold mb-4">Add New Admin</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Admin Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="admin@landbiznes.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Admin Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  {adminRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || !formData.email || !formData.name}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Creating..." : "Create Admin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Current Admins */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Current Admins ({admins.length})</h2>

          {admins.map((admin) => {
            const roleInfo = adminRoles.find((r) => r.id === admin.role);
            return (
              <Card
                key={admin.id}
                className="p-6 border border-border rounded-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{admin.name}</h3>
                        {admin.isSuperAdmin && (
                          <Badge className="bg-red-500/10 text-red-500 ml-2">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      admin.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-gray-500/10 text-gray-500"
                    }
                  >
                    {admin.status === "active" ? "🟢 Active" : "🔴 Inactive"}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{roleInfo?.name}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Joined {admin.joinedDate}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleInfo?.permissions.map((perm, idx) => (
                      <Badge
                        key={idx}
                        className="bg-blue-500/10 text-blue-500 text-xs"
                      >
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!admin.isSuperAdmin && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-2" />
                        Edit Role
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRemoveAdmin(admin.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Admin Roles Reference */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Available Admin Roles</h2>

          <Tabs defaultValue="super-admin" className="space-y-6">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl overflow-x-auto">
              {adminRoles.map((role) => (
                <TabsTrigger
                  key={role.id}
                  value={role.id}
                  className="rounded-lg data-[state=active]:bg-background"
                >
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {adminRoles.map((role) => (
              <TabsContent key={role.id} value={role.id}>
                <Card className="p-6 border border-border">
                  <h3 className="text-xl font-bold mb-2">{role.name}</h3>
                  <p className="text-muted-foreground mb-4">{role.description}</p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Permissions:</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {role.permissions.map((perm, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{perm}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {role.id === "super-admin" && (
                      <Card className="p-3 bg-red-500/5 border border-red-500/20">
                        <p className="text-xs text-red-600">
                          ⚠️ Only {SUPER_ADMIN_EMAIL} can access this role
                        </p>
                      </Card>
                    )}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
