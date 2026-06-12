import { db } from "@/lib/db";
import { platformLabel } from "@/lib/stats";
import { syncNow } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid_state: "Güvenlik doğrulaması başarısız oldu, lütfen tekrar deneyin.",
  channel_fetch_failed: "Kanal bilgisi alınamadı, lütfen tekrar deneyin.",
  no_channel: "Bu Google hesabına bağlı bir YouTube kanalı bulunamadı.",
  access_denied: "İzin ekranında erişim reddedildi.",
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const accounts = await db.account.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { connectedAt: "asc" },
  });

  const googleConfigured =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const metaConfigured = !!process.env.META_APP_ID && !!process.env.META_APP_SECRET;
  const hasConnected = accounts.some((a) => a.accessToken);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Hesaplar</h2>

      {params.connected === "youtube" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          YouTube kanalı başarıyla bağlandı. İçerikler bir sonraki senkronda
          (veya aşağıdaki düğmeyle hemen) çekilecek.
        </p>
      )}
      {params.connected === "instagram" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Instagram hesabı başarıyla bağlandı. Gönderiler ve metrikler bir
          sonraki senkronda (veya aşağıdaki düğmeyle hemen) çekilecek.
        </p>
      )}
      {params.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessages[params.error] ?? `Bağlantı hatası: ${params.error}`}
        </p>
      )}

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

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Yeni hesap bağla</h3>
        <div className="flex flex-wrap items-center gap-3">
          {googleConfigured ? (
            <a
              href="/api/auth/google"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              ▶ YouTube kanalını bağla
            </a>
          ) : (
            <span className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
              ▶ YouTube — önce .env dosyasına GOOGLE_CLIENT_ID ve
              GOOGLE_CLIENT_SECRET ekleyin
            </span>
          )}
          {metaConfigured ? (
            <a
              href="/api/auth/meta"
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
            >
              📷 Instagram hesabını bağla
            </a>
          ) : (
            <span className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
              📷 Instagram — önce META_APP_ID ve META_APP_SECRET ekleyin
            </span>
          )}
        </div>
      </section>

      {hasConnected && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Senkronizasyon</h3>
          <p className="mb-3 text-sm text-zinc-500">
            Metrikler ve yorumlar /api/cron ile periyodik çekilir; beklemeden
            şimdi başlatabilirsiniz.
          </p>
          <form
            action={async () => {
              "use server";
              await syncNow();
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Şimdi senkronize et
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
