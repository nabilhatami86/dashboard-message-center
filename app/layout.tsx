import "./globals.css";
import AuthInitializer from "@/components/auth/AuthInitializer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
