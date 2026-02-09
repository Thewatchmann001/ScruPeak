"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileCheck,
  Users,
  MapPin,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Upload,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = [
  {
    icon: MapPin,
    label: "Total Listings",
    value: "1,234",
    change: "+12%",
    trend: "up",
    color: "from-blue-500/10 to-blue-500/5",
  },
  {
    icon: FileCheck,
    label: "Verified Documents",
    value: "892",
    change: "+8%",
    trend: "up",
    color: "from-green-500/10 to-green-500/5",
  },
  {
    icon: Clock,
    label: "Pending Verification",
    value: "47",
    change: "-3%",
    trend: "down",
    color: "from-yellow-500/10 to-yellow-500/5",
  },
  {
    icon: Users,
    label: "Verified Agents",
    value: "156",
    change: "+5%",
    trend: "up",
    color: "from-purple-500/10 to-purple-500/5",
  },
  {
    icon: AlertCircle,
    label: "Flagged Issues",
    value: "12",
    change: "-2%",
    trend: "down",
    color: "from-red-500/10 to-red-500/5",
  },
  {
    icon: DollarSign,
    label: "Transaction Volume",
    value: "₦2.4M",
    change: "+15%",
    trend: "up",
    color: "from-emerald-500/10 to-emerald-500/5",
  },
];

const recentDocuments = [
  {
    id: "DOC-001",
    ownerName: "Robert Koroma",
    address: "123 Main Street",
    documentType: "survey-document",
    uploadedDate: "2 hours ago",
    status: "pending",
  },
  {
    id: "DOC-002",
    ownerName: "Amara Johnson",
    address: "456 Oak Avenue",
    documentType: "chief-approval",
    uploadedDate: "4 hours ago",
    status: "pending",
  },
  {
    id: "DOC-003",
    ownerName: "Ibrahim Hassan",
    address: "789 Pine Road",
    documentType: "buyer-seller-agreement",
    uploadedDate: "1 day ago",
    status: "verified",
  },
];

const pendingAgents = [
  {
    id: "AGT-001",
    name: "James Wilson",
    registrationDate: "3 days ago",
    status: "pending",
    documents: 3,
  },
  {
    id: "AGT-002",
    name: "Maria Garcia",
    registrationDate: "5 days ago",
    status: "pending",
    documents: 4,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage documents, agents, and land listings
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend === "up";
            return (
              <Card
                key={stat.label}
                className={`p-6 bg-gradient-to-br ${stat.color} border border-border rounded-2xl`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-1">
                    <TrendingUp
                      className={`w-4 h-4 ${
                        isPositive
                          ? "text-green-500 rotate-0"
                          : "text-red-500 rotate-180"
                      }`}
                    />
                    <span
                      className={
                        isPositive
                          ? "text-green-500 text-xs font-semibold"
                          : "text-red-500 text-xs font-semibold"
                      }
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin/documents">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Upload Documents</p>
                  <p className="text-xs text-muted-foreground">Add & verify land docs</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/agents">
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Verify Agents</p>
                  <p className="text-xs text-muted-foreground">Approve agents</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/land-ids">
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:shadow-lg hover:border-green-500/40 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Land IDs</p>
                  <p className="text-xs text-muted-foreground">View generated IDs</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/manage">
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:shadow-lg hover:border-red-500/40 transition-all cursor-pointer h-full md:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Manage Admins</p>
                  <p className="text-xs text-muted-foreground">Add & manage admin roles</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-background">
              Recent Documents
            </TabsTrigger>
            <TabsTrigger value="agents" className="rounded-lg data-[state=active]:bg-background">
              Pending Agents
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-background">
              Activity Log
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Uploads</h3>
              <Link href="/admin/documents">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </div>
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileCheck className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">{doc.ownerName}</h4>
                      <Badge
                        className={
                          doc.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-green-500/10 text-green-500"
                        }
                      >
                        {doc.status === "pending" ? "⏳ Pending" : "✓ Verified"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.address} • {doc.documentType.replace("-", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.uploadedDate}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Agents Awaiting Verification</h3>
              <Link href="/admin/agents">
                <Button variant="ghost" size="sm">
                  View All →
                </Button>
              </Link>
            </div>
            {pendingAgents.map((agent) => (
              <Card key={agent.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium">{agent.name}</h4>
                      <Badge className="bg-yellow-500/10 text-yellow-500">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Documents: {agent.documents} • Registered {agent.registrationDate}
                    </p>
                  </div>
                  <Link href="/admin/agents">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="p-6 bg-muted/50 border border-border rounded-lg">
              <div className="space-y-4">
                <ActivityItem
                  time="2 hours ago"
                  action="Document verified"
                  details="survey-document for Robert Koroma"
                  icon="✓"
                />
                <ActivityItem
                  time="4 hours ago"
                  action="Agent registered"
                  details="James Wilson submitted agent application"
                  icon="+"
                />
                <ActivityItem
                  time="6 hours ago"
                  action="Land ID generated"
                  details="LAND-SL-2025-00045 assigned to Amara Johnson"
                  icon="🏷"
                />
                <ActivityItem
                  time="1 day ago"
                  action="Document flagged"
                  details="Potential fraud detected in buyer-seller-agreement"
                  icon="⚠"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ActivityItem({
  time,
  action,
  details,
  icon,
}: {
  time: string;
  action: string;
  details: string;
  icon: string;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="text-xl">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-sm">{action}</p>
        <p className="text-xs text-muted-foreground">{details}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}
