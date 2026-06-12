// Oturum yönetimi: jose ile imzalı JWT, httpOnly çerezde taşınır.
// Şifre doğrulama bcrypt ile yapılır (login action içinde).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "panel_session";
const SESSION_DURATION_S = 7 * 24 * 60 * 60; // 7 gün

export function authConfigured(): boolean {
  return !!(
    process.env.AUTH_SECRET &&
    process.env.AUTH_USERNAME &&
    process.env.AUTH_PASSWORD_HASH
  );
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET en az 32 karakter olmalı (openssl rand -hex 32)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_S)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true, // JavaScript erişemez (XSS'e karşı)
  secure: process.env.NODE_ENV === "production", // yalnızca HTTPS
  sameSite: "lax" as const, // CSRF'e karşı
  path: "/",
  maxAge: SESSION_DURATION_S,
};
