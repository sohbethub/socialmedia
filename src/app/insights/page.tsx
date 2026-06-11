import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  BEST_TIME: "⏰ Zamanlama",
  CONTENT_TYPE: "🎬 İçerik Türü",
  TITLE: "✏️ Başlık",
  ENGAGEMENT: "💬 Etkileşim",
};

export default async function InsightsPage() {
  const insights = await db.insight.findMany({
    where: { dismissedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Büyüme Önerileri</h2>
      <p className="text-sm text-zinc-500">
        Birikmiş metriklerden üretilen öneriler. Faz 4&apos;te Claude API ile doğal
        dilde, daha derin analizler eklenecek.
      </p>

      {insights.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Henüz öneri yok — metrik verisi biriktikçe burada görünecek.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.map((i) => (
            <article key={i.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="mb-2 text-xs font-medium text-zinc-500">
                {kindLabel[i.kind] ?? i.kind}
              </p>
              <h3 className="mb-2 font-semibold">{i.title}</h3>
              <p className="text-sm text-zinc-600">{i.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
