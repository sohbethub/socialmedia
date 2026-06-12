import { db } from "@/lib/db";
import { platformLabel } from "@/lib/stats";
import { createScheduledPost, deleteScheduledPost } from "./actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  DRAFT: "Taslak",
  SCHEDULED: "Planlandı",
  PUBLISHED: "Yayınlandı",
  FAILED: "Hata",
};

const statusStyle: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

export default async function PlannerPage() {
  const [accounts, scheduled] = await Promise.all([
    db.account.findMany({ orderBy: { displayName: "asc" } }),
    db.scheduledPost.findMany({
      include: { account: true },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Planlayıcı</h2>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 font-semibold">Yeni Paylaşım Planla</h3>
        <form action={createScheduledPost} className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Hesap</span>
            <select
              name="accountId"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {platformLabel(a.platform)} — {a.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Yayın Zamanı</span>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            <span className="font-medium">Başlık</span>
            <input
              name="title"
              required
              placeholder="Video / paylaşım başlığı"
              className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm lg:col-span-2">
            <span className="font-medium">Açıklama (isteğe bağlı)</span>
            <textarea
              name="description"
              rows={3}
              className="rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Planla
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Planlanan Paylaşımlar</h3>
        {scheduled.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz plan yok.</p>
        ) : (
          <ul className="space-y-3">
            {scheduled.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-zinc-500">
                    {platformLabel(s.account.platform)} · {s.account.displayName} ·{" "}
                    {s.scheduledAt.toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {s.error && <p className="mt-1 text-xs text-red-600">{s.error}</p>}
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[s.status] ?? statusStyle.DRAFT}`}
                  >
                    {statusLabel[s.status] ?? s.status}
                  </span>
                  {s.status !== "PUBLISHED" && (
                    <form action={deleteScheduledPost}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        Sil
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
