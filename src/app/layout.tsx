import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { OrgProvider } from "@/lib/OrgContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <OrgProvider>{children}</OrgProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
