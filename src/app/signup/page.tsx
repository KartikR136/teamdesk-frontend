"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await signup(form.email, form.password, form.name);
      router.push("/dashboard");
    } catch {
      setError("Could not create account");
    }
  }

  return (
    <main className="max-w-sm mx-auto mt-20 p-6">
      <h1 className="text-xl font-bold mb-4">Sign up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white p-2 rounded">
          Sign up
        </button>
      </form>
    </main>
  );
}
