import { db } from "@/lib/db";
import { buildReplyDraft } from "@/lib/replies";
import { platformLabel, sentimentLabel } from "@/lib/stats";
import { replyToComment } from "./actions";

export const dynamic = "force-dynamic";

const sentimentStyle: Record<string, string> = {
  POSITIVE: "bg-emerald-100 text-emerald-700",
  NEGATIVE: "bg-red-100 text-red-700",
  QUESTION: "bg-blue-100 text-blue-700",
  NEUTRAL: "bg-zinc-100 text-zinc-600",
};

export default async function CommentsPage() {
  const comments = await db.comment.findMany({
    include: { post: { include: { account: true } } },
    orderBy: [{ repliedAt: { sort: "asc", nulls: "first" } }, { publishedAt: "desc" }],
  });

  const pending = comments.filter((c) => !c.repliedAt);
  const replied = comments.filter((c) => c.repliedAt);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Yorumlar</h2>

      <section>
        <h3 className="mb-3 font-semibold">
          Yanıt Bekleyenler{" "}
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {pending.length}
          </span>
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">Bekleyen yorum yok. 🎉</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700">{c.authorName}</span>
                  <span>·</span>
                  <span>{platformLabel(c.post.account.platform)}</span>
                  <span>·</span>
                  <span className="truncate">{c.post.title}</span>
                  {c.sentiment && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 font-medium ${sentimentStyle[c.sentiment] ?? sentimentStyle.NEUTRAL}`}
                    >
                      {sentimentLabel(c.sentiment)}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm">{c.text}</p>
                <form action={replyToComment} className="flex gap-2">
                  <input type="hidden" name="commentId" value={c.id} />
                  <input
                    name="text"
                    required
                    defaultValue={buildReplyDraft(c.authorName, c.sentiment)}
                    placeholder="Yanıtınızı yazın..."
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Yanıtla
                  </button>
                </form>
                <p className="mt-1.5 text-xs text-zinc-400">
                  ✏️ Yanıt kutusu yorumun türüne göre hazır taslakla dolduruldu —
                  göndermeden önce düzenleyebilirsin.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {replied.length > 0 && (
        <section>
          <h3 className="mb-3 font-semibold text-zinc-600">Yanıtlananlar</h3>
          <ul className="space-y-3">
            {replied.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
                <p className="text-zinc-600">
                  <span className="font-medium text-zinc-800">{c.authorName}:</span>{" "}
                  {c.text}
                </p>
                <p className="mt-1 text-zinc-500">
                  <span className="font-medium text-emerald-700">Yanıt:</span>{" "}
                  {c.replyText}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
