"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";
import { useCallback } from "react";

interface Org {
  id: string;
  name: string;
  slug: string;
  role: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
}

interface OrgContextValue {
  orgs: Org[];
  currentOrg: Org | null;
  setCurrentOrgId: (id: string) => void;
  loading: boolean;
  refetchOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiFetch("/api/organizations");

      setOrgs(data);

      const savedId = localStorage.getItem("currentOrgId");
      const stillValid = data.find((o: Org) => o.id === savedId);

      setCurrentOrgIdState(stillValid ? savedId : (data[0]?.id ?? null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      setLoading(true);

      try {
        const data = await apiFetch("/api/organizations");

        setOrgs(data);

        const savedId = localStorage.getItem("currentOrgId");
        const stillValid = data.find((o: Org) => o.id === savedId);

        setCurrentOrgIdState(stillValid ? savedId : (data[0]?.id ?? null));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  function setCurrentOrgId(id: string) {
    setCurrentOrgIdState(id);
    localStorage.setItem("currentOrgId", id);
  }

  const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? null;

  return (
    <OrgContext.Provider
      value={{
        orgs,
        currentOrg,
        setCurrentOrgId,
        loading,
        refetchOrgs: fetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
