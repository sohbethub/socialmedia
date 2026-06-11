// Ücretsiz, kural tabanlı analiz motoru: API maliyeti olmadan, istatistiksel
// kurallarla hataları ve büyüme önerilerini üretir.
import { db } from "./db";
import { engagementRate, formatNumber } from "./stats";

interface RuleInsight {
  kind: string;
  title: string;
  body: string;
}

const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY = 24 * 60 * 60 * 1000;

export async function generateRuleBasedInsights(): Promise<number> {
  const posts = await db.post.findMany({
    include: {
      account: true,
      metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
      comments: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  const withMetrics = posts.filter((p) => p.metrics[0]);
  const insights: RuleInsight[] = [];

  if (withMetrics.length >= 2) {
    const avgViews =
      withMetrics.reduce((s, p) => s + p.metrics[0].views, 0) / withMetrics.length;

    // 1. En iyi yayın günü: günlere göre ortalama izlenme
    const byDay = new Map<number, number[]>();
    for (const p of withMetrics) {
      const day = p.publishedAt.getDay();
      byDay.set(day, [...(byDay.get(day) ?? []), p.metrics[0].views]);
    }
    const dayAverages = [...byDay.entries()]
      .filter(([, views]) => views.length >= 1)
      .map(([day, views]) => ({
        day,
        count: views.length,
        avg: views.reduce((a, b) => a + b, 0) / views.length,
      }))
      .sort((a, b) => b.avg - a.avg);
    const best = dayAverages[0];
    if (best && byDay.size >= 2 && best.avg > avgViews * 1.25) {
      insights.push({
        kind: "BEST_TIME",
        title: `En verimli yayın günün: ${DAY_NAMES[best.day]}`,
        body: `${DAY_NAMES[best.day]} günü yayınlanan ${best.count} içerik ortalama ${formatNumber(Math.round(best.avg))} izlenme aldı — kanal ortalamasının (${formatNumber(Math.round(avgViews))}) %${Math.round((best.avg / avgViews - 1) * 100)} üzerinde. Sıradaki paylaşımlarını ${DAY_NAMES[best.day]} gününe planlamayı dene.`,
      });
    }

    // 2. En iyi içerik → benzerlerini üret
    const sorted = [...withMetrics].sort((a, b) => b.metrics[0].views - a.metrics[0].views);
    const top = sorted[0];
    if (top.metrics[0].views > avgViews * 1.5) {
      insights.push({
        kind: "CONTENT_TYPE",
        title: "En çok izlenen içeriğinin formatını tekrarla",
        body: `"${top.title}" ${formatNumber(top.metrics[0].views)} izlenme ile kanal ortalamasının ${(top.metrics[0].views / avgViews).toFixed(1)} katına ulaştı. Bu içeriğin konusunu/formatını seri haline getirmek büyümeyi hızlandırabilir.`,
      });
    }

    // 3. En kötü içerik → hata olarak işaretle
    const bottom = sorted[sorted.length - 1];
    if (sorted.length >= 4 && bottom.metrics[0].views < avgViews * 0.4) {
      insights.push({
        kind: "MISTAKE",
        title: "Düşük performanslı format tespit edildi",
        body: `"${bottom.title}" yalnızca ${formatNumber(bottom.metrics[0].views)} izlenme aldı — kanal ortalamasının (${formatNumber(Math.round(avgViews))}) çok altında. Bu tür içerikte ısrar etmeden önce başlığını, kapağını veya formatını gözden geçir.`,
      });
    }

    // 4. Etkileşim oranı düşük içerikler
    const avgEng =
      withMetrics.reduce((s, p) => s + engagementRate(p.metrics[0]), 0) / withMetrics.length;
    const lowEng = withMetrics.filter(
      (p) => p.metrics[0].views > avgViews * 0.5 && engagementRate(p.metrics[0]) < avgEng * 0.5,
    );
    if (lowEng.length > 0 && avgEng > 0) {
      insights.push({
        kind: "ENGAGEMENT",
        title: `${lowEng.length} içerikte izlenmeye göre etkileşim düşük`,
        body: `Örneğin "${lowEng[0].title}" izlenme almasına rağmen etkileşim oranı (%${(engagementRate(lowEng[0].metrics[0]) * 100).toFixed(1)}) kanal ortalamasının (%${(avgEng * 100).toFixed(1)}) yarısının altında. Videoda izleyiciye soru sormak, yorum/beğeni çağrısı yapmak etkileşimi artırır.`,
      });
    }
  }

  // 5. Yanıtlanmamış yorumlar
  const unanswered = await db.comment.count({ where: { repliedAt: null } });
  if (unanswered > 0) {
    insights.push({
      kind: "MISTAKE",
      title: `${unanswered} yorum yanıt bekliyor`,
      body: `İlk 24 saat içinde yanıtlanan yorumlar hem izleyici bağlılığını hem de algoritma sinyalini güçlendirir. Yorumlar sayfasından bekleyen yanıtları tamamla.`,
    });
  }

  // 6. Paylaşım düzeni: son paylaşımdan bu yana geçen süre ve ortalama aralık
  if (posts.length >= 3) {
    const dates = posts.map((p) => p.publishedAt.getTime()).sort((a, b) => b - a);
    const gaps = dates.slice(0, -1).map((d, i) => d - dates[i + 1]);
    const avgGapDays = gaps.reduce((a, b) => a + b, 0) / gaps.length / DAY;
    const sinceLastDays = (Date.now() - dates[0]) / DAY;

    if (sinceLastDays > avgGapDays * 2 && sinceLastDays > 7) {
      insights.push({
        kind: "MISTAKE",
        title: "Paylaşım aralığın açıldı",
        body: `Son içeriğin üzerinden ${Math.round(sinceLastDays)} gün geçti; ortalama paylaşım aralığın ${Math.round(avgGapDays)} gün. Düzensiz paylaşım algoritmadaki görünürlüğü düşürür — planlayıcıdan yeni içerik takvimle.`,
      });
    } else if (avgGapDays <= 10) {
      insights.push({
        kind: "OPPORTUNITY",
        title: "Paylaşım düzenin iyi, sürdür",
        body: `Ortalama ${Math.round(avgGapDays)} günde bir içerik yayınlıyorsun. Bu düzeni korumak algoritma görünürlüğü için en önemli etkenlerden biri — planlayıcıyı kullanarak takvimi önceden doldur.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      kind: "OPPORTUNITY",
      title: "Analiz için henüz yeterli veri yok",
      body: "Birkaç içerik ve metrik senkronu biriktikten sonra burada veriye dayalı bulgular görünecek. Hesabını bağlayıp senkronizasyonu çalıştırdığından emin ol.",
    });
  }

  // Eski analiz sonuçlarını kapat, yenilerini yaz
  await db.insight.updateMany({
    where: { dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  await db.insight.createMany({
    data: insights.map((i) => ({ ...i, basedOn: "rule-based" })),
  });

  return insights.length;
}
