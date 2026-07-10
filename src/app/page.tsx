"use client";

import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    checkHealth()
      .then((data) => setStatus(JSON.stringify(data)))
      .catch(() => setStatus("backend unreachable"));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">TeamDesk — Milestone 0</h1>
      <p className="mt-4">Backend health: {status}</p>
    </main>
  );
}
