import { db } from "@/lib/db";
import { dailyTotalViews, topPostsSeries } from "@/lib/charts";
import {
  engagementRate,
  formatNumber,
  formatPercent,
  platformLabel,
} from "@/lib/stats";
import { TopPostsChart, TotalViewsChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [posts, postsWithHistory] = await Promise.all([
    db.post.findMany({
      include: {
        account: true,
        metrics: { orderBy: { capturedAt: "desc" }, take: 8 },
      },
      orderBy: { publishedAt: "desc" },
    }),
    db.post.findMany({
      include: { metrics: { orderBy: { capturedAt: "asc" } } },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const totalSeries = dailyTotalViews(postsWithHistory, 30);
  const top = topPostsSeries(postsWithHistory, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analiz</h2>
      <p className="text-sm text-zinc-500">
        Her içeriğin güncel metrikleri ve son 7 günlük izlenme değişimi.
        Etkileşim oranı = (beğeni + yorum + paylaşım + kaydetme) / izlenme.
      </p>

      {totalSeries.length >= 2 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Son 30 Gün — Toplam İzlenme</h3>
          <TotalViewsChart data={totalSeries} />
        </section>
      )}

      {top.data.length >= 2 && top.series.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">En Çok İzlenen 5 İçeriğin Seyri</h3>
          <TopPostsChart data={top.data} series={top.series} />
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">İçerik</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3 text-right">İzlenme</th>
              <th className="px-4 py-3 text-right">Beğeni</th>
              <th className="px-4 py-3 text-right">Yorum</th>
              <th className="px-4 py-3 text-right">Etkileşim</th>
              <th className="px-4 py-3 text-right">7 Günlük Değişim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {posts.map((p) => {
              const latest = p.metrics[0];
              const weekAgo = p.metrics[p.metrics.length - 1];
              const delta =
                latest && weekAgo && weekAgo.views > 0
                  ? (latest.views - weekAgo.views) / weekAgo.views
                  : null;
              return (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-zinc-400">
                      {p.publishedAt.toLocaleDateString("tr-TR")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {platformLabel(p.account.platform)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {latest ? formatNumber(latest.views) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {latest ? formatNumber(latest.likes) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {latest ? formatNumber(latest.comments) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {latest ? formatPercent(engagementRate(latest)) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      delta == null
                        ? "text-zinc-400"
                        : delta >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  >
                    {delta == null
                      ? "—"
                      : `${delta >= 0 ? "+" : ""}${formatPercent(delta)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
