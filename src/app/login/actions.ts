"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  authConfigured,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

// Zamanlama saldırılarına karşı sabit süreli karşılaştırma
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function login(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!authConfigured()) {
    return {
      error:
        "Giriş henüz yapılandırılmamış: AUTH_USERNAME, AUTH_PASSWORD_HASH ve AUTH_SECRET ortam değişkenlerini tanımlayın.",
    };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const userOk = safeEquals(username, process.env.AUTH_USERNAME!);
  // bcrypt karşılaştırması kullanıcı adı yanlış olsa da çalıştırılır ki
  // yanıt süresinden kullanıcı adının doğruluğu anlaşılamasın
  const passOk = await bcrypt.compare(password, process.env.AUTH_PASSWORD_HASH!);

  if (!userOk || !passOk) {
    // Kaba kuvvet denemelerini yavaşlat
    await new Promise((r) => setTimeout(r, 1500));
    return { error: "Kullanıcı adı veya şifre hatalı." };
  }

  const token = await createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
