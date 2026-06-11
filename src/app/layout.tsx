import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sosyal Medya Paneli",
  description: "Instagram ve YouTube hesap yönetimi, analiz ve planlama",
};

const nav = [
  { href: "/", label: "Genel Bakış", icon: "📊" },
  { href: "/analytics", label: "Analiz", icon: "📈" },
  { href: "/comments", label: "Yorumlar", icon: "💬" },
  { href: "/planner", label: "Planlayıcı", icon: "📅" },
  { href: "/insights", label: "Öneriler", icon: "💡" },
  { href: "/accounts", label: "Hesaplar", icon: "🔗" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white px-4 py-6">
            <h1 className="mb-8 px-2 text-lg font-bold tracking-tight">
              Sosyal Medya Paneli
            </h1>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
