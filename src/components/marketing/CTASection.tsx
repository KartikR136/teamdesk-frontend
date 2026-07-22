"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800" />

          {/* Subtle texture orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-success/8 blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative px-8 py-14 sm:px-14 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-pill bg-white/10 border border-white/15"
            >
              <Zap size={12} className="text-warning" />
              <span className="text-xs font-semibold text-stone-300">
                No credit card. No setup fee.
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5 max-w-2xl mx-auto leading-[1.1]"
            >
              Start building with a team that trusts its own tooling.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="text-base text-stone-400 leading-relaxed max-w-md mx-auto mb-9"
            >
              Set up your workspace in under two minutes. Invite your team.
              Start shipping with full context — not just tickets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/signup">
                <Button
                  size="xl"
                  className="bg-white text-stone-900 hover:bg-stone-100 shadow-lg"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Create your workspace
                </Button>
              </Link>
              <Link href="/security">
                <Button
                  variant="ghost"
                  size="xl"
                  className="text-stone-300 hover:text-white hover:bg-white/10"
                >
                  Read the security overview
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
