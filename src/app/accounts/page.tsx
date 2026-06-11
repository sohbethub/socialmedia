import { db } from "@/lib/db";
import { platformLabel } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await db.account.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { connectedAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hesaplar</h2>
      <p className="text-sm text-zinc-500">
        Bağlı sosyal medya hesapları. Gerçek OAuth bağlantısı Faz 2 (YouTube) ve
        Faz 3&apos;te (Instagram) eklenecek; şu an demo hesaplar görüntüleniyor.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{a.displayName}</p>
                <p className="text-sm text-zinc-500">{platformLabel(a.platform)}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  a.accessToken
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {a.accessToken ? "Bağlı" : "Demo"}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {a._count.posts} içerik senkronize edildi
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
        <p className="font-medium text-zinc-700">Yeni hesap bağlama</p>
        <p className="mt-1">
          Google OAuth (YouTube) ve Meta OAuth (Instagram) akışları entegrasyon
          fazlarında buraya eklenecek. Gerekli anahtarlar için{" "}
          <code className="rounded bg-zinc-200 px-1">.env.example</code> dosyasına bakın.
        </p>
      </div>
    </div>
  );
}
