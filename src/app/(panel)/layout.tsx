import Link from "next/link";
import { logout } from "@/app/login/actions";

const nav = [
  { href: "/", label: "Genel Bakış", icon: "📊" },
  { href: "/analytics", label: "Analiz", icon: "📈" },
  { href: "/comments", label: "Yorumlar", icon: "💬" },
  { href: "/planner", label: "Planlayıcı", icon: "📅" },
  { href: "/competitors", label: "Rakip Takibi", icon: "🆚" },
  { href: "/insights", label: "Öneriler", icon: "💡" },
  { href: "/accounts", label: "Hesaplar", icon: "🔗" },
];

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-6">
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
        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
          >
            <span>🚪</span>
            Çıkış yap
          </button>
        </form>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
