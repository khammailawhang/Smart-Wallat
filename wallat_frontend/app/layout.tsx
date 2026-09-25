import "./globals.css";

export const metadata = {
  title: "My Secure Smart Wallet",
  description: "Secure MariaDB Wallet Dashboard Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We add suppressHydrationWarning to both tags to cleanly bypass extension locks
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
