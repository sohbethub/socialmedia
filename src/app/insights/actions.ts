"use server";

import { revalidatePath } from "next/cache";
import { generateInsights } from "@/lib/ai";
import { generateRuleBasedInsights } from "@/lib/rules";

// Ücretsiz, kural tabanlı analiz — varsayılan yol
export async function runFreeAnalysis() {
  await generateRuleBasedInsights();
  revalidatePath("/insights");
  revalidatePath("/");
}

// İsteğe bağlı: Claude API ile derin analiz (ANTHROPIC_API_KEY gerektirir)
export async function runAiAnalysis() {
  await generateInsights();
  revalidatePath("/insights");
  revalidatePath("/");
}
