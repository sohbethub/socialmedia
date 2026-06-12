// Metrik anlık görüntülerinden grafik serileri üretir (sunucu tarafında çalışır).
import type { MetricSnapshot, Post } from "@prisma/client";

type PostWithMetrics = Post & { metrics: MetricSnapshot[] };

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  views: number;
}

export interface MultiSeriesPoint {
  date: string;
  [postKey: string]: string | number;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Günlük toplam izlenme serisi: her gün için her içeriğin o günkü son anlık
 * görüntüsü alınır, içerik bazında toplanır.
 */
export function dailyTotalViews(posts: PostWithMetrics[], days = 30): DailyPoint[] {
  // gün -> postId -> o günkü son izlenme değeri
  const byDay = new Map<string, Map<string, number>>();
  for (const p of posts) {
    for (const m of p.metrics) {
      const key = dayKey(m.capturedAt);
      const dayMap = byDay.get(key) ?? new Map<string, number>();
      dayMap.set(p.id, m.views); // metrics tarihe göre artan sıralı: sonuncusu kalır
      byDay.set(key, dayMap);
    }
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result: DailyPoint[] = [];
  // İçerik o gün senkronlanmadıysa son bilinen değeri taşı (eğri düşmesin)
  const lastKnown = new Map<string, number>();
  const allDays = [...byDay.keys()].sort();
  for (const day of allDays) {
    for (const [postId, views] of byDay.get(day)!) {
      lastKnown.set(postId, views);
    }
    if (new Date(day) >= since) {
      let total = 0;
      for (const v of lastKnown.values()) total += v;
      result.push({ date: day, views: total });
    }
  }
  return result;
}

/**
 * En çok izlenen N içeriğin izlenme eğrileri (çok çizgili grafik için).
 * Döndürülen series: çizgi anahtarları ve okunur etiketleri.
 */
export function topPostsSeries(
  posts: PostWithMetrics[],
  top = 5,
): { data: MultiSeriesPoint[]; series: { key: string; label: string }[] } {
  const ranked = [...posts]
    .filter((p) => p.metrics.length > 0)
    .sort(
      (a, b) =>
        (b.metrics[b.metrics.length - 1]?.views ?? 0) -
        (a.metrics[a.metrics.length - 1]?.views ?? 0),
    )
    .slice(0, top);

  const series = ranked.map((p, i) => ({
    key: `p${i}`,
    label: p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title,
  }));

  const byDate = new Map<string, MultiSeriesPoint>();
  ranked.forEach((p, i) => {
    for (const m of p.metrics) {
      const key = dayKey(m.capturedAt);
      const point = byDate.get(key) ?? { date: key };
      point[`p${i}`] = m.views;
      byDate.set(key, point);
    }
  });

  const data = [...byDate.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );
  return { data, series };
}
