"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const scheduleSchema = z.object({
  accountId: z.string().min(1, "Hesap seçin"),
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  description: z.string().trim().max(5000).optional(),
  scheduledAt: z.coerce.date(),
});

export async function createScheduledPost(formData: FormData) {
  const parsed = scheduleSchema.safeParse({
    accountId: formData.get("accountId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    scheduledAt: formData.get("scheduledAt"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  await db.scheduledPost.create({
    data: { ...parsed.data, status: "SCHEDULED" },
  });

  revalidatePath("/planner");
}

export async function deleteScheduledPost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.scheduledPost.delete({ where: { id } });
  revalidatePath("/planner");
}
