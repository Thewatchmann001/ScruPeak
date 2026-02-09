"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  FileText,
  MapPin,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const agentsData = [
  {
    id: "AGT-001",
    name: "Robert Koroma",
    email: "robert@example.com",
    phone: "+232 78 123 456",
    licenseNumber: "LIC-2025-001",
    registrationDate: "3 days ago",
    status: "pending",
    documents: ["License", "ID Card", "Background Check"],
    listings: 5,
    transactions: 2,
  },
  {
    id: "AGT-002",
    name: "Amara Johnson",
    email: "amara@example.com",
    phone: "+232 76 789 012",
    licenseNumber: "LIC-2025-002",
    registrationDate: "1 week ago",
    status: "pending",
    documents: ["License", "ID Card"],
    listings: 3,
    transactions: 1,
  },
  {
    id: "AGT-003",
    name: "Ibrahim Hassan",
    email: "ibrahim@example.com",
    phone: "+232 72 345 678",
    licenseNumber: "LIC-2025-003",
    registrationDate: "2 weeks ago",
    status: "verified",
    documents: ["License", "ID Card", "Background Check", "Insurance"],
    listings: 12,
    transactions: 8,
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(agentsData);

  const handleVerifyAgent = (agentId: string) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: "verified" } : agent
      )
    );
  };

  const handleRejectAgent = (agentId: string) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: "rejected" } : agent
      )
    );
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Agent Verification</h1>
          <p className="text-muted-foreground mt-1">Verify and manage real estate agents</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background">
              Pending Verification
            </TabsTrigger>
            <TabsTrigger value="verified" className="rounded-lg data-[state=active]:bg-background">
              Verified Agents
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background">
              All Agents
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="space-y-4">
              {agents
                .filter((agent) => agent.status === "pending")
                .map((agent) => (
                  <AgentReviewCard
                    key={agent.id}
                    agent={agent}
                    onVerify={() => handleVerifyAgent(agent.id)}
                    onReject={() => handleRejectAgent(agent.id)}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Verified Tab */}
          <TabsContent value="verified" className="space-y-6">
            <div className="space-y-4">
              {agents
                .filter((agent) => agent.status === "verified")
                .map((agent) => (
                  <AgentVerifiedCard key={agent.id} agent={agent} />
                ))}
            </div>
          </TabsContent>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-6">
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id}>
                  {agent.status === "pending" ? (
                    <AgentReviewCard
                      agent={agent}
                      onVerify={() => handleVerifyAgent(agent.id)}
                      onReject={() => handleRejectAgent(agent.id)}
                    />
                  ) : (
                    <AgentVerifiedCard agent={agent} />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AgentReviewCard({
  agent,
  onVerify,
  onReject,
}: {
  agent: any;
  onVerify: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{agent.name}</h3>
              <p className="text-sm text-muted-foreground">{agent.licenseNumber}</p>
            </div>
            <Badge className="bg-yellow-500/10 text-yellow-500 ml-auto">
              Pending Verification
            </Badge>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{agent.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{agent.phone}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Registered {agent.registrationDate}</span>
        </div>
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{agent.documents.length} Documents</span>
        </div>
      </div>

      {/* Documents List */}
      <div className="mb-6 pb-6 border-b border-border">
        <p className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Submitted Documents
        </p>
        <div className="flex flex-wrap gap-2">
          {agent.documents.map((doc) => (
            <Badge key={doc} className="bg-green-500/10 text-green-500">
              ✓ {doc}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Listings</p>
          <p className="text-xl font-bold">{agent.listings}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Completed Transactions</p>
          <p className="text-xl font-bold">{agent.transactions}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onVerify}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Approve Agent
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="flex-1 bg-transparent border-border hover:bg-muted"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </Card>
  );
}

function AgentVerifiedCard({ agent }: { agent: any }) {
  return (
    <Card className="p-6 bg-card border border-green-500/20 rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{agent.name}</h3>
              <p className="text-sm text-muted-foreground">{agent.licenseNumber}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-500 ml-auto">
              Verified
            </Badge>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Listings</p>
          <p className="text-lg font-bold">{agent.listings}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Transactions</p>
          <p className="text-lg font-bold">{agent.transactions}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
          <p className="text-lg font-bold">100%</p>
        </div>
      </div>
    </Card>
  );
}
