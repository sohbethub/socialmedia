import { db } from "@/lib/db";
import { aiConfigured } from "@/lib/ai";
import { runAiAnalysis } from "./actions";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = {
  MISTAKE: "⚠️ Hata",
  BEST_TIME: "⏰ Zamanlama",
  CONTENT_TYPE: "🎬 İçerik Türü",
  TITLE: "✏️ Başlık",
  ENGAGEMENT: "💬 Etkileşim",
  OPPORTUNITY: "🚀 Fırsat",
};

const kindStyle: Record<string, string> = {
  MISTAKE: "border-red-200 bg-red-50",
  OPPORTUNITY: "border-emerald-200 bg-emerald-50",
};

export default async function InsightsPage() {
  const insights = await db.insight.findMany({
    where: { dismissedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const hasAi = aiConfigured();
  const lastRun = insights[0]?.createdAt;
  const mistakes = insights.filter((i) => i.kind === "MISTAKE");
  const suggestions = insights.filter((i) => i.kind !== "MISTAKE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Büyüme Önerileri</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Yapay zeka, içerik metriklerini ve yorumları derinlemesine analiz edip
            hataları ve fırsatları çıkarır.
            {lastRun && (
              <>
                {" "}
                Son analiz:{" "}
                {lastRun.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
              </>
            )}
          </p>
        </div>
        {hasAi ? (
          <form action={runAiAnalysis}>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              ✨ AI analizi çalıştır
            </button>
          </form>
        ) : (
          <span className="rounded-lg bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500">
            AI analizi için .env dosyasına ANTHROPIC_API_KEY ekleyin
          </span>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          Henüz analiz yok.{" "}
          {hasAi
            ? "Yukarıdaki düğmeyle ilk AI analizini başlatın."
            : "ANTHROPIC_API_KEY ekledikten sonra ilk analizinizi çalıştırabilirsiniz."}
        </p>
      ) : (
        <>
          {mistakes.length > 0 && (
            <section>
              <h3 className="mb-3 font-semibold text-red-700">
                Tespit Edilen Hatalar ({mistakes.length})
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {mistakes.map((i) => (
                  <InsightCard key={i.id} kind={i.kind} title={i.title} body={i.body} />
                ))}
              </div>
            </section>
          )}

          {suggestions.length > 0 && (
            <section>
              <h3 className="mb-3 font-semibold">Öneriler ({suggestions.length})</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {suggestions.map((i) => (
                  <InsightCard key={i.id} kind={i.kind} title={i.title} body={i.body} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function InsightCard({ kind, title, body }: { kind: string; title: string; body: string }) {
  return (
    <article
      className={`rounded-xl border p-5 ${kindStyle[kind] ?? "border-zinc-200 bg-white"}`}
    >
      <p className="mb-2 text-xs font-medium text-zinc-500">{kindLabel[kind] ?? kind}</p>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-zinc-600">{body}</p>
    </article>
  );
}
