import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Security", href: "#security" },
    { label: "Changelog", href: "#", soon: true },
    { label: "Roadmap", href: "#", soon: true },
  ],
  Security: [
    { label: "Security overview", href: "/security" },
    { label: "Attack Console", href: "/security" },
    { label: "Threat model", href: "/security" },
    { label: "Responsible disclosure", href: "#", soon: true },
  ],
  Workspace: [
    { label: "Sign in", href: "/login" },
    { label: "Create account", href: "/signup" },
    { label: "Forgot password", href: "/forgot-password" },
    { label: "Onboarding", href: "/onboarding" },
  ],
  Company: [
    { label: "About", href: "#", soon: true },
    { label: "Blog", href: "#", soon: true },
    { label: "Privacy policy", href: "#", soon: true },
    { label: "Terms of service", href: "#", soon: true },
  ],
};

/** Reuse the same LogoMark shape from MarketingHeader without importing it (avoids "use client" cascade) */
function FooterLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="7" fill="var(--primary)" />
        <rect x="5" y="8" width="18" height="3.5" rx="1.75" fill="white" />
        <rect x="11.25" y="8" width="5.5" height="13" rx="2" fill="white" />
      </svg>
      <span className="text-sm font-semibold tracking-tight text-text group-hover:text-primary transition-colors duration-fast">
        TeamDesk
      </span>
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background-subtle">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <FooterLogo />
            <p className="text-sm text-text-muted leading-relaxed mt-4 max-w-xs">
              A modern engineering workspace with production-grade security, a
              Decision Log, and an audit trail that proves it.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-fast"
                aria-label="GitHub"
              >
                {/* GitHub mark */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="15"
                  height="15"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-fast"
                aria-label="Twitter / X"
              >
                {/* X (Twitter) mark */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-subtle mb-4">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"soon" in link && link.soon ? (
                      <span className="text-sm text-text-subtle flex items-center gap-1.5">
                        {link.label}
                        <span className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-text-subtle">
                          soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-muted hover:text-text transition-colors duration-fast"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
          <p className="text-xs text-text-subtle">
            &copy; {new Date().getFullYear()} TeamDesk. Built with care.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-subtle">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
