"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Eye,
  TestTube,
  FileText,
  Terminal,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const PILLARS = [
  {
    icon: Lock,
    title: "Tenant isolation at the query level",
    description:
      "organizationId is denormalized onto every resource. Every list and read query filters by it directly — there's no join that can accidentally return cross-org data.",
  },
  {
    icon: Eye,
    title: "Roles loaded fresh on every request",
    description:
      "JWTs carry only identity, never roles. Permissions are loaded from the database on each request (with short-lived Redis cache) — a stale or forged token can never grant elevated access.",
  },
  {
    icon: TestTube,
    title: "Hostile-tenant test persona",
    description:
      "A dedicated test persona — an authenticated user probing another org's boundaries — is a first-class actor in the test suite, not an afterthought.",
  },
  {
    icon: AlertTriangle,
    title: "Documented discrepancies, not hidden ones",
    description:
      "Known trade-offs (CSRF posture, shared rate-limiter buckets, stale-role window) are named honestly in the threat model rather than omitted to look better.",
  },
];

const ATTACK_SCENARIOS = [
  { label: "Cross-org cursor replay",     blocked: true },
  { label: "IDOR on issue/comment/decision", blocked: true },
  { label: "Wrong-recipient invite accept", blocked: true },
  { label: "projectId escalation via decision", blocked: true },
  { label: "Role token forgery",          blocked: true },
  { label: "Cross-org member list leak",  blocked: true },
];


export function SecuritySection() {
  return (
    <section
      id="security"
      className="relative border-t border-border overflow-hidden"
    >
      {/* Dark background panel */}
      <div className="bg-stone-900 dark:bg-[#0a0908]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-pill bg-success/10 border border-success/20">
                  <ShieldCheck size={13} className="text-success" />
                  <span className="text-xs font-semibold text-success">
                    Proof, not claims
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-5">
                  Security documented like an engineering decision,{" "}
                  <span className="text-stone-400">not a pricing page.</span>
                </h2>
                <p className="text-base text-stone-400 leading-relaxed mb-8">
                  Most tools describe their security in a paragraph. TeamDesk
                  documents every attack vector, the exact mechanism that blocks
                  it, and one honestly-named discrepancy found while building it.
                </p>
              </motion.div>

              <div className="space-y-5">
                {PILLARS.map(({ icon: Icon, title, description }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.45, ease: "easeOut" }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-stone-300">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">
                        {title}
                      </p>
                      <p className="text-sm text-stone-400 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/security">
                  <Button variant="secondary" size="md"
                    className="bg-white/10 hover:bg-white/15 border-white/15 text-white"
                  >
                    <FileText size={15} />
                    Read the threat model
                  </Button>
                </Link>
                <Link href="/security">
                  <Button variant="secondary" size="md"
                    className="bg-white/10 hover:bg-white/15 border-white/15 text-white"
                  >
                    <Terminal size={15} />
                    Open Attack Console
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — attack scenarios terminal */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0, 0, 0.2, 1] }}
            >
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono ml-2">
                    attack-console — live scenarios
                  </span>
                </div>

                {/* Terminal body */}
                <div className="p-5 font-mono text-[12px] space-y-3">
                  <div className="text-stone-500">
                    $ run --all --env=demo --persona=hostile-tenant
                  </div>
                  <div className="text-stone-400">
                    Initializing 6 attack scenarios…
                  </div>

                  {ATTACK_SCENARIOS.map(({ label, blocked }, i) => (
                    <motion.div
                      key={label}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                    >
                      <CheckCircle2 size={13} className="text-success shrink-0" />
                      <span className="text-stone-300">{label}</span>
                      <span className="ml-auto text-[11px] text-success">
                        BLOCKED
                      </span>
                    </motion.div>
                  ))}

                  <div className="pt-2 border-t border-white/10 text-success">
                    ✓ All scenarios passed. Zero cross-org data leaks detected.
                  </div>
                </div>
              </div>

              {/* Stat chips */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { value: "6", label: "Attack scenarios" },
                  { value: "0", label: "Data leaks" },
                  { value: "100%", label: "Tests passing" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
                  >
                    <p className="text-xl font-bold text-white tracking-tight">
                      {value}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
