"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <Container className="py-12">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Manage your land portfolio and transactions"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "My Listings", value: "5", icon: "📋" },
          { label: "Active Offers", value: "2", icon: "💰" },
          { label: "Pending Transactions", value: "1", icon: "⏳" },
          { label: "Total Value", value: "$2.5M", icon: "💎" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-sm text-slate-600">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { title: "Listed new property", time: "2 hours ago", type: "success" },
                { title: "Received offer on Farm Land", time: "1 day ago", type: "info" },
                { title: "Completed transaction", time: "3 days ago", type: "success" },
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-4 pb-4 border-b border-slate-200 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <CardContent className="p-6 space-y-3">
            <Link href="/land/new" className="block">
              <Button className="w-full">List New Property</Button>
            </Link>
            <Button variant="outline" className="w-full">Browse Available Land</Button>
            <Button variant="ghost" className="w-full">View My Listings</Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
