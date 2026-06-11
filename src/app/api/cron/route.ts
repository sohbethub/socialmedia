import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Periyodik görevler. Dış bir zamanlayıcı (sunucu cron'u, Vercel Cron vb.)
// bu rotayı düzenli aralıklarla çağırır:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron
//
// Görevler:
// 1. Metrik toplama   → Faz 2/3'te PlatformClient.getMetrics ile doldurulacak
// 2. Yorum senkronu   → Faz 2/3'te PlatformClient.getComments ile doldurulacak
// 3. Planlı yayın     → zamanı gelen ScheduledPost kayıtlarını işler
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await db.scheduledPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    include: { account: true },
  });

  const results: { id: string; status: string }[] = [];

  for (const post of due) {
    if (!post.account.accessToken) {
      // Demo hesap: gerçek yayın yapılamaz, yayınlanmış olarak işaretle.
      await db.scheduledPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", publishedId: `demo_${post.id}` },
      });
      results.push({ id: post.id, status: "PUBLISHED (demo)" });
      continue;
    }

    // Faz 2/3: platforma göre PlatformClient.publishPost çağrılacak.
    await db.scheduledPost.update({
      where: { id: post.id },
      data: {
        status: "FAILED",
        error: "Platform yayını henüz uygulanmadı (Faz 2/3)",
      },
    });
    results.push({ id: post.id, status: "FAILED" });
  }

  return NextResponse.json({
    ok: true,
    processedScheduledPosts: results,
    ranAt: new Date().toISOString(),
  });
}
