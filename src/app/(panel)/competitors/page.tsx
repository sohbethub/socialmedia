import { db } from "@/lib/db";
import { formatNumber } from "@/lib/stats";
import { AddCompetitorForm } from "./add-form";
import { deleteCompetitorAction, refreshCompetitorsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const competitors = await db.competitor.findMany({
    include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 2 } },
    orderBy: [{ isSelf: "desc" }, { addedAt: "asc" }],
  });

  const hasYouTube = !!(await db.account.findFirst({
    where: { platform: "YOUTUBE", accessToken: { not: null } },
  }));
  const lastUpdate = competitors
    .flatMap((c) => c.snapshots[0]?.capturedAt ?? [])
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rakip Takibi</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Nişindeki kanalları ekle; abone, izlenme ve yükleme sıklığını kendi
            kanalınla kıyasla.
            {lastUpdate && (
              <>
                {" "}
                Son güncelleme:{" "}
                {lastUpdate.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
              </>
            )}
          </p>
        </div>
        {competitors.length > 0 && (
          <form action={refreshCompetitorsAction}>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              🔄 Şimdi güncelle
            </button>
          </form>
        )}
      </div>

      {!hasYouTube ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Rakip takibi YouTube API&apos;sini kullanır — önce Hesaplar sayfasından
          bir YouTube kanalı bağlamalısın.
        </p>
      ) : (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 font-semibold">Yeni rakip ekle</h3>
          <AddCompetitorForm />
        </section>
      )}

      {competitors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Kanal</th>
                <th className="px-4 py-3 text-right">Abone</th>
                <th className="px-4 py-3 text-right">Toplam İzlenme</th>
                <th className="px-4 py-3 text-right">Video</th>
                <th className="px-4 py-3 text-right">Son 30 Gün Video</th>
                <th className="px-4 py-3 text-right">Son 5 Video Ort. İzlenme</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {competitors.map((c) => {
                const s = c.snapshots[0];
                const prev = c.snapshots[1];
                const subDelta = s && prev ? s.subscribers - prev.subscribers : null;
                return (
                  <tr key={c.id} className={c.isSelf ? "bg-blue-50/60" : "hover:bg-zinc-50"}>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {c.name}
                        {c.isSelf && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Sen
                          </span>
                        )}
                      </p>
                      {c.handle && <p className="text-xs text-zinc-400">{c.handle}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {s ? formatNumber(s.subscribers) : "—"}
                      {subDelta != null && subDelta !== 0 && (
                        <span
                          className={`ml-1.5 text-xs font-medium ${subDelta > 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {subDelta > 0 ? "+" : ""}
                          {formatNumber(subDelta)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s ? formatNumber(Number(s.totalViews)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{s ? formatNumber(s.videoCount) : "—"}</td>
                    <td className="px-4 py-3 text-right">{s ? s.recentVideos30d : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {s ? formatNumber(s.recentAvgViews) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.isSelf && (
                        <form action={deleteCompetitorAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-400 hover:text-red-600"
                          >
                            Kaldır
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
