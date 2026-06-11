"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const replySchema = z.object({
  commentId: z.string().min(1),
  text: z.string().trim().min(1, "Yanıt boş olamaz").max(2000),
});

// Yanıtı veritabanına kaydeder. Gerçek platform entegrasyonu (Faz 2/3)
// geldiğinde burada ilgili PlatformClient.replyToComment çağrısı da yapılacak.
export async function replyToComment(formData: FormData) {
  const parsed = replySchema.safeParse({
    commentId: formData.get("commentId"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  await db.comment.update({
    where: { id: parsed.data.commentId },
    data: { replyText: parsed.data.text, repliedAt: new Date() },
  });

  revalidatePath("/comments");
}
