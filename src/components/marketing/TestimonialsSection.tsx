"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "The Decision Log alone is worth it. We used to lose the 'why' the moment a PR was merged. Now it's structured, searchable, and attached to the relevant issues.",
    author: "Priya M.",
    role: "Staff Engineer",
    company: "Series B startup",
    initials: "PM",
    accentClass: "bg-primary-subtle text-primary",
  },
  {
    quote:
      "I've reviewed the threat model and the Attack Console. This is the most honest security posture I've seen in a product at this stage — they document what doesn't work, not just what does.",
    author: "James K.",
    role: "Security Engineer",
    company: "Fintech platform",
    initials: "JK",
    accentClass: "bg-success-subtle text-success",
  },
  {
    quote:
      "Most trackers are either too simple or too bloated. TeamDesk sits in the right place — opinionated enough to stay out of the way, powerful enough to handle a real engineering org.",
    author: "Tara L.",
    role: "Engineering Manager",
    company: "Remote-first team",
    initials: "TL",
    accentClass: "bg-warning-subtle text-warning",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-border bg-background-subtle">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <motion.div
          className="max-w-lg mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            What teams say
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-text">
            Built to earn trust,{" "}
            <span className="text-text-muted font-normal">not just ship features.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, author, role, company, initials, accentClass }, i) => (
            <motion.div
              key={author}
              className="relative rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5
                         hover:border-border-hover hover:shadow-md transition-all duration-normal"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: [0, 0, 0.2, 1] }}
            >
              {/* Quote mark */}
              <Quote size={18} className="text-border shrink-0" />

              <p className="text-sm text-text-muted leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${accentClass}`}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{author}</p>
                  <p className="text-xs text-text-muted">
                    {role} · {company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
