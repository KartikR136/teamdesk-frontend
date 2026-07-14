"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type { Organization } from "@/types";

interface OrgContextValue {
  orgs: Organization[];
  currentOrg: Organization | null;
  setCurrentOrgId: (id: string) => void;
  loading: boolean;
  refetchOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // BUGFIX (M2 reorg): this logic used to be written twice — once here as
  // fetchOrgs (exposed as refetchOrgs), and again duplicated verbatim
  // inside the mount useEffect below. The two copies had no way to be kept
  // in sync if one changed. Now there's exactly one implementation; the
  // effect just calls it.
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Organization[]>("/api/organizations");
      setOrgs(data);

      const savedId = localStorage.getItem("currentOrgId");
      const stillValid = data.find((o) => o.id === savedId);
      setCurrentOrgIdState(stillValid ? savedId : (data[0]?.id ?? null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      await fetchOrgs();
    })();
  }, [user, fetchOrgs]);

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
