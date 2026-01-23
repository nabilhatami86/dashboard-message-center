import "./globals.css";
import AuthInitializer from "@/components/auth/AuthInitializer";
import ThemeProvider from "@/components/providers/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
