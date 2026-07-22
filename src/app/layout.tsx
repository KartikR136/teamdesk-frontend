import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { OrgProvider } from "@/providers/OrgProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s — TeamDesk",
    default: "TeamDesk — Engineering workspace for modern teams",
  },
  description:
    "A focused multi-tenant project management platform with production-grade authorization, tenant isolation, and auditability.",
  keywords: [
    "project management",
    "issue tracker",
    "decision log",
    "team collaboration",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <OrgProvider>
              <ToastProvider>{children}</ToastProvider>
            </OrgProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
