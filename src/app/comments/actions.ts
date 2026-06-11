"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getValidAccessToken } from "@/lib/google";
import { YouTubeClient } from "@/lib/platforms/youtube";

const replySchema = z.object({
  commentId: z.string().min(1),
  text: z.string().trim().min(1, "Yanıt boş olamaz").max(2000),
});

// Yanıtı önce platforma gönderir (hesap bağlıysa), sonra veritabanına işler.
// Demo hesaplarda yalnızca veritabanına kaydedilir.
export async function replyToComment(formData: FormData) {
  const parsed = replySchema.safeParse({
    commentId: formData.get("commentId"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const comment = await db.comment.findUniqueOrThrow({
    where: { id: parsed.data.commentId },
    include: { post: { include: { account: true } } },
  });

  const account = comment.post.account;
  if (account.accessToken && account.platform === "YOUTUBE") {
    const client = new YouTubeClient(await getValidAccessToken(account.id));
    await client.replyToComment(comment.externalId, parsed.data.text);
  }
  // Instagram yanıt gönderimi Faz 3'te eklenecek

  await db.comment.update({
    where: { id: comment.id },
    data: { replyText: parsed.data.text, repliedAt: new Date() },
  });

  revalidatePath("/comments");
}
