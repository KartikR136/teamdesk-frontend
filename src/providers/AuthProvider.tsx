"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, registerSessionExpiredHandler } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null);
      router.push("/login?expired=1");
    });
  }, [router]);

  useEffect(() => {
    apiFetch<User>("/api/auth/me")
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data);
  }

  async function signup(email: string, password: string, name: string) {
    const data = await apiFetch<User>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setUser(data);
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
