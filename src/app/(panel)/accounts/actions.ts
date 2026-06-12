"use server";

import { revalidatePath } from "next/cache";
import { syncAllAccounts, type SyncResult } from "@/lib/sync";

// "Şimdi senkronize et" düğmesi: cron'u beklemeden elle senkron başlatır.
export async function syncNow(): Promise<SyncResult[]> {
  const results = await syncAllAccounts();
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/analytics");
  revalidatePath("/comments");
  return results;
}
