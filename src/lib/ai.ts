// Claude API ile içerik analizi: birikmiş metrik ve yorum verisinden
// hataları ve büyüme önerilerini üretir, Insight tablosuna kaydeder.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { db } from "./db";
import { engagementRate } from "./stats";

const InsightSchema = z.object({
  insights: z
    .array(
      z.object({
        kind: z
          .enum(["MISTAKE", "BEST_TIME", "CONTENT_TYPE", "TITLE", "ENGAGEMENT", "OPPORTUNITY"])
          .describe(
            "MISTAKE: yapılan bir hata/sorun; BEST_TIME: zamanlama önerisi; CONTENT_TYPE: içerik türü önerisi; TITLE: başlık/açıklama önerisi; ENGAGEMENT: etkileşim önerisi; OPPORTUNITY: büyüme fırsatı",
          ),
        title: z.string().describe("Kısa, net başlık (Türkçe)"),
        body: z
          .string()
          .describe(
            "Öneri/hatanın açıklaması: hangi veriye dayandığı, neden önemli olduğu ve atılacak somut adım (Türkçe, 2-4 cümle)",
          ),
      }),
    )
    .min(3)
    .max(10),
});

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Veritabanındaki veriyi modele verilecek kompakt bir özete dönüştürür. */
async function buildDataSummary(): Promise<string> {
  const posts = await db.post.findMany({
    include: {
      account: true,
      metrics: { orderBy: { capturedAt: "desc" }, take: 8 },
      comments: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const lines = posts.map((p) => {
    const latest = p.metrics[0];
    const weekAgo = p.metrics[p.metrics.length - 1];
    const growth =
      latest && weekAgo && weekAgo.views > 0
        ? Math.round(((latest.views - weekAgo.views) / weekAgo.views) * 100)
        : null;
    const unanswered = p.comments.filter((c) => !c.repliedAt).length;
    const published = p.publishedAt;
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

    return [
      `- "${p.title}" (${p.account.platform})`,
      `yayın: ${dayNames[published.getDay()]} ${String(published.getHours()).padStart(2, "0")}:00, ${published.toISOString().slice(0, 10)}`,
      latest
        ? `izlenme: ${latest.views}, beğeni: ${latest.likes}, yorum: ${latest.comments}, etkileşim: %${(engagementRate(latest) * 100).toFixed(1)}`
        : "metrik yok",
      growth != null ? `son 7 gün izlenme değişimi: %${growth}` : "",
      unanswered > 0 ? `yanıtlanmamış yorum: ${unanswered}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  });

  const totalUnanswered = await db.comment.count({ where: { repliedAt: null } });
  const scheduled = await db.scheduledPost.count({ where: { status: "SCHEDULED" } });

  return [
    `İçerik listesi (en yeniden eskiye, ${posts.length} adet):`,
    ...lines,
    "",
    `Toplam yanıtlanmamış yorum: ${totalUnanswered}`,
    `Planlanmış bekleyen paylaşım: ${scheduled}`,
  ].join("\n");
}

const SYSTEM_PROMPT = `Sen YouTube ve Instagram kanalları için çalışan deneyimli bir sosyal medya
büyüme danışmanısın. Sana bir içerik üreticisinin panel verileri verilecek:
içerik listesi, yayın zamanları, izlenme/beğeni/yorum metrikleri, etkileşim
oranları, son 7 günlük izlenme değişimleri ve yanıtlanmamış yorum sayıları.

Görevin:
1. Veriyi derinlemesine analiz et: hangi içerikler iyi/kötü performans göstermiş,
   yayın zamanlarının ve içerik türlerinin (başlıklardan çıkarım yap) etkisi ne,
   etkileşim oranları sağlıklı mı, yorum yönetimi nasıl.
2. Üreticinin yaptığı somut HATALARI açıkça söyle (kind: MISTAKE) — örneğin
   düzensiz yayın aralığı, kötü performans gösteren formatta ısrar, yorumları
   yanıtsız bırakma, düşük etkileşimli saatlerde paylaşım.
3. Veriye dayalı, uygulanabilir büyüme önerileri ver (diğer kind değerleri).

Kurallar:
- Her bulguyu mutlaka verideki somut sayılara dayandır; genel geçer tavsiye verme.
- Türkçe yaz. Doğrudan ve dürüst ol; hata varsa açıkça söyle ama yapıcı kal.
- Karşılaştırma yaparken kanal ortalamasını referans al.
- En önemli/etkili bulguları öne koy.`;

export async function generateInsights(): Promise<number> {
  if (!aiConfigured()) {
    throw new Error("ANTHROPIC_API_KEY tanımlı değil — AI analizi için .env dosyasına ekleyin");
  }

  const summary = await buildDataSummary();
  const client = new Anthropic();

  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: summary }],
    output_config: { format: zodOutputFormat(InsightSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("AI yanıtı çözümlenemedi, lütfen tekrar deneyin");
  }

  // Eski analiz sonuçlarını kapat, yenilerini yaz
  await db.insight.updateMany({
    where: { dismissedAt: null },
    data: { dismissedAt: new Date() },
  });
  await db.insight.createMany({
    data: parsed.insights.map((i) => ({
      kind: i.kind,
      title: i.title,
      body: i.body,
      basedOn: "ai-analysis",
    })),
  });

  return parsed.insights.length;
}
