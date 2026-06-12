"use client";

import { useActionState } from "react";
import { addCompetitorAction } from "./actions";

export function AddCompetitorForm() {
  const [state, formAction, pending] = useActionState(addCompetitorAction, null);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap gap-2">
        <input
          name="channel"
          required
          placeholder="Kanal adresi veya @kullaniciadi (örn. youtube.com/@kanal)"
          className="w-full max-w-md flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Ekleniyor..." : "Rakip ekle"}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="mt-2 text-sm text-emerald-600">{state.success}</p>}
    </div>
  );
}
