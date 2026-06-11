"use server";

import { revalidatePath } from "next/cache";
import { generateInsights } from "@/lib/ai";

export async function runAiAnalysis() {
  await generateInsights();
  revalidatePath("/insights");
  revalidatePath("/");
}
