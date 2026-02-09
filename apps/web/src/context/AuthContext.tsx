"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
      if (session?.user) {
          setUser(session.user as unknown as User);
      } else {
          setUser(null);
      }
  }, [session]);

  const login = async (email: string, password: string) => {
    const { data, error } = await signIn.email({
        email,
        password,
    });
    if (error) {
        throw error;
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const { data, error } = await signUp.email({
        email,
        password,
        name,
        role // This will be handled if defined in additionalFields on server
    });
    if (error) {
        throw error;
    }
  };
  
  const checkAuth = async () => {
      // Handled automatically by useSession hook
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isPending,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
