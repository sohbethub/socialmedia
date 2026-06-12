"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">Sosyal Medya Paneli</h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Devam etmek için giriş yapın
        </p>

        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {state?.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Kullanıcı adı</span>
            <input
              name="username"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Şifre</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
