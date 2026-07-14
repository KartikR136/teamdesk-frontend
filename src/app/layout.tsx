import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { OrgProvider } from "@/providers/OrgProvider";
import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OrgProvider>
            <ToastProvider>{children}</ToastProvider>
          </OrgProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
