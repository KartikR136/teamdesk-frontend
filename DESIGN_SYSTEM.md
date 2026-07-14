# TeamDesk Design System

This document describes the visual and component system introduced in
Milestone 3 of the V2 transformation. It exists so any future contributor
(or interviewer) can understand not just *what* the system looks like, but
*why* it's built the way it is.

---

## Philosophy

TeamDesk's UI should communicate the same engineering discipline as its
backend: precise, predictable, and unmistakably its own. The system is
built on semantic tokens and a small set of accessible primitives —
enough to cover what the product currently needs, not a speculative
component catalog.

## Color Philosophy

Tokens are named **semantically** (`--primary`, `--surface`, `--danger`),
never by their literal palette value (`--indigo-600`). Components only
ever reference the semantic layer. This means:

- The entire product can be re-themed (dark mode, a rebrand, a white-label
  variant) by editing `src/styles/theme.css` alone — no component touches
  a raw color value.
- The underlying palette — zinc neutrals, indigo accent — was carried over
  deliberately from the M6 milestone, where the `RoleBadge` component's
  weight-scales-with-permission-rank pattern was named as the product's
  one signature visual element. That decision is preserved as the *value*
  behind `--primary`, not hard-coded into every component that uses it.

**Rule enforced in this milestone**: no file under `components/ui/`
contains a raw Tailwind color utility (`zinc-`, `indigo-`, `gray-`,
`slate-`). Verify with:

```bash
grep -rn "zinc-\|indigo-\|gray-\|slate-" src/components/ui/
```

This should return nothing. (Existing page files outside `components/ui/`
still use raw utilities until their migration milestone — see Roadmap.)

## Typography Scale

A single sans-serif system stack for UI text, a monospace stack reserved
for identifiers/emails/timestamps only (per the original M6 decision —
`font-mono` is not decorative). Six sizes (`xs` through `2xl`) cover every
current use case; no display/heading face was introduced since nothing in
the current product needs one yet.

## Spacing & Elevation Scale

Spacing follows a 4px base unit (`--space-1` = 4px through `--space-16` =
64px). Elevation is a four-step shadow scale (`xs`/`sm`/`md`/`lg`) using a
consistent shadow color (`zinc-900` at low opacity) rather than a generic
black, so shadows read as part of the same palette rather than a
default-browser gray.

## Motion Principles

Three durations (`fast` 120ms, `normal` 180ms, `slow` 280ms) and one easing
curve (`ease-standard`) are the only motion values in the system. Every
component — button hover, dialog open, dropdown open, toast enter/exit —
draws from this same set, so state changes feel like one consistent
language rather than each component inventing its own timing.

`prefers-reduced-motion` is respected globally in `theme.css`, not
per-component — one rule, guaranteed coverage, no component can forget it.

## Component Philosophy

Every primitive was evaluated against one question: **does this need
Radix's accessibility internals, or is it simple enough to own outright?**

**Hand-written** (Button, Input, Card, Badge, Skeleton): no complex
interaction state, no focus-trapping or ARIA choreography needed. Writing
these directly against our tokens keeps them small and avoids stripping
out a third-party library's default styling.

**Radix-backed** (Dialog, Dropdown, Toast, Avatar): these have real
accessibility logic — focus trapping, escape-key handling, ARIA live
regions, portal rendering — that's genuinely worth not re-implementing.
Radix provides the behavior; every visual property is still driven by our
own tokens, not a shadcn default theme.

Only 9 primitives exist. The full doc-4 wishlist (Table, Pagination,
Breadcrumb, Command, Sheet, Drawer, Tooltip, Calendar) was deliberately
**not** built — nothing in the current product needs them. They'll be
added in whichever milestone first requires them, per the project's
standing rule: no complexity without a measurable benefit.

## Accessibility Decisions

- **Dialog** replaces the native `confirm()` call previously used for the
  Members remove-flow — `confirm()` is not screen-reader-friendly, isn't
  stylable, and blocks the main thread. This is a named fix, not just a
  restyle.
- **Focus rings** are a single token (`--focus-ring`) applied consistently
  via `focus-visible`, not `focus`, so mouse users don't see a ring on
  click while keyboard users always do.
- **Reduced motion** is enforced globally (see Motion Principles above).

## What's Deliberately Deferred

- Dark mode: the token architecture (CSS variables mapped via `@theme`)
  is dark-mode-ready — a second `[data-theme="dark"]` value block is all
  a future milestone would need to add. Not built now because no page
  consumes it yet (Milestone 10, per roadmap).
- Table, Pagination, Command, Sheet, Drawer, Tooltip, Calendar: no current
  page needs them. Added when a milestone's actual page work requires one,
  not speculatively.

## Verifying This Milestone

```bash
npx tsc --noEmit
npm run lint
npm run build
grep -rn "zinc-\|indigo-\|gray-\|slate-" src/components/ui/   # must return nothing
```
