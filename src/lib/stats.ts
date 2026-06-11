// Sayfalarda ortak kullanılan metrik/biçimlendirme yardımcıları.
import type { MetricSnapshot, Post } from "@prisma/client";

type PostWithLatestMetric = Post & { metrics: MetricSnapshot[] };

/** Her içeriğin en güncel anlık görüntüsünü toplayıp genel toplamları döndürür. */
export function latestMetricsByPost(posts: PostWithLatestMetric[]) {
  return posts.reduce(
    (acc, p) => {
      const m = p.metrics[0];
      if (!m) return acc;
      acc.views += m.views;
      acc.likes += m.likes;
      acc.comments += m.comments;
      acc.shares += m.shares;
      acc.saves += m.saves;
      return acc;
    },
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  );
}

/** Etkileşim oranı: (beğeni + yorum + paylaşım + kaydetme) / izlenme */
export function engagementRate(m: MetricSnapshot): number {
  if (m.views === 0) return 0;
  return (m.likes + m.comments + m.shares + m.saves) / m.views;
}

export function platformLabel(platform: string): string {
  switch (platform) {
    case "YOUTUBE":
      return "YouTube";
    case "INSTAGRAM":
      return "Instagram";
    default:
      return platform;
  }
}

export function sentimentLabel(sentiment: string | null): string {
  switch (sentiment) {
    case "POSITIVE":
      return "Olumlu";
    case "NEGATIVE":
      return "Olumsuz";
    case "QUESTION":
      return "Soru";
    case "NEUTRAL":
      return "Nötr";
    default:
      return "—";
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    notation: n >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}
