"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-12 sm:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Info */}
        <div className="hidden md:block">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            Welcome Back
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Sign in to access your land listings, transactions, and more.
          </p>
          <div className="space-y-4">
            {[
              "Secure, blockchain-verified transactions",
              "Real-time communication with other users",
              "Automated fraud detection",
              "24/7 customer support",
            ].map((item) => (
              <div key={item} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-success-100 text-success-600 flex items-center justify-center flex-shrink-0 mt-1">
                  ✓
                </div>
                <p className="text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                  Sign up
                </Link>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2">Demo Credentials</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>Email: <code className="bg-white px-2 py-1 rounded">demo@example.com</code></p>
                  <p>Password: <code className="bg-white px-2 py-1 rounded">password123</code></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
