"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { addCompetitor, refreshCompetitors } from "@/lib/competitors";

export async function addCompetitorAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string } | null> {
  const parsed = z.string().trim().min(2).safeParse(formData.get("channel"));
  if (!parsed.success) return { error: "Kanal adresi girin." };

  try {
    const name = await addCompetitor(parsed.data);
    revalidatePath("/competitors");
    return { success: `"${name}" takip listesine eklendi.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Kanal eklenemedi." };
  }
}

export async function deleteCompetitorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.competitor.delete({ where: { id } });
  revalidatePath("/competitors");
}

export async function refreshCompetitorsAction() {
  await refreshCompetitors();
  revalidatePath("/competitors");
}
