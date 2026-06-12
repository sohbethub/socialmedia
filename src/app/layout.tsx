import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sosyal Medya Paneli",
  description: "Instagram ve YouTube hesap yönetimi, analiz ve planlama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
