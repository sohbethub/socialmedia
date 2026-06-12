import Link from "next/link";
import { db } from "@/lib/db";
import { dailyTotalViews } from "@/lib/charts";
import { latestMetricsByPost, platformLabel, formatNumber } from "@/lib/stats";
import { TotalViewsChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [posts, pendingComments, upcoming, insights, postsWithHistory] = await Promise.all([
    db.post.findMany({
      include: {
        account: true,
        metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
      },
      orderBy: { publishedAt: "desc" },
    }),
    db.comment.count({ where: { repliedAt: null } }),
    db.scheduledPost.findMany({
      where: { status: "SCHEDULED" },
      include: { account: true },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    db.insight.findMany({
      where: { dismissedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.post.findMany({
      include: { metrics: { orderBy: { capturedAt: "asc" } } },
    }),
  ]);

  const trend = dailyTotalViews(postsWithHistory, 30);
  const totals = latestMetricsByPost(posts);
  const topPosts = [...posts]
    .sort((a, b) => (b.metrics[0]?.views ?? 0) - (a.metrics[0]?.views ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Genel Bakış</h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam İzlenme" value={formatNumber(totals.views)} />
        <StatCard label="Toplam Beğeni" value={formatNumber(totals.likes)} />
        <StatCard label="Toplam Yorum" value={formatNumber(totals.comments)} />
        <StatCard
          label="Yanıt Bekleyen Yorum"
          value={String(pendingComments)}
          highlight={pendingComments > 0}
        />
      </div>

      {trend.length >= 2 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Son 30 Gün — İzlenme Eğilimi</h3>
          <TotalViewsChart data={trend} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">En Çok İzlenen İçerikler</h3>
          <ul className="divide-y divide-zinc-100">
            {topPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-zinc-500">
                    {platformLabel(p.account.platform)} ·{" "}
                    {p.publishedAt.toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <span className="ml-4 shrink-0 text-sm font-semibold">
                  {formatNumber(p.metrics[0]?.views ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/analytics" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Tüm analizler →
          </Link>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Yaklaşan Paylaşımlar</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">Planlanmış paylaşım yok.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcoming.map((s) => (
                <li key={s.id} className="py-2.5">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-zinc-500">
                    {platformLabel(s.account.platform)} ·{" "}
                    {s.scheduledAt.toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/planner" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Planlayıcıya git →
          </Link>
        </section>
      </div>

      {insights.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 font-semibold">💡 Güncel Öneriler</h3>
          <ul className="space-y-2">
            {insights.map((i) => (
              <li key={i.id} className="text-sm">
                <span className="font-medium">{i.title}</span>
                <span className="text-zinc-600"> — {i.body}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
