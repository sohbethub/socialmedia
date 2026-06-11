// Google OAuth 2.0 yardımcıları (YouTube Data API v3 erişimi için).
import { db } from "./db";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// youtube.force-ssl: video/yorum okuma + yorum yanıtlama için yeterli tek kapsam
const SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"];

function clientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET .env dosyasında tanımlı olmalı",
    );
  }
  return { clientId, clientSecret };
}

export function redirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function buildAuthUrl(origin: string, state: string) {
  const { clientId } = clientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // refresh token almak için
    prompt: "consent", // refresh token'ın her bağlantıda gelmesini garantiler
    state,
  });
  return `${AUTH_URL}?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCode(
  code: string,
  origin: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = clientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token değişimi başarısız: ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = clientCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token yenileme başarısız: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Hesabın geçerli bir erişim anahtarını döndürür; süresi dolmak üzereyse
 * refresh token ile yeniler ve veritabanına kaydeder.
 */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await db.account.findUniqueOrThrow({ where: { id: accountId } });
  if (!account.accessToken) {
    throw new Error(`Hesap bağlı değil: ${account.displayName}`);
  }

  const stillValid =
    account.tokenExpiry && account.tokenExpiry.getTime() > Date.now() + 60_000;
  if (stillValid) return account.accessToken;

  if (!account.refreshToken) {
    throw new Error(
      `Erişim süresi doldu ve refresh token yok; hesabı yeniden bağlayın: ${account.displayName}`,
    );
  }

  const tokens = await refreshAccessToken(account.refreshToken);
  await db.account.update({
    where: { id: account.id },
    data: {
      accessToken: tokens.access_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return tokens.access_token;
}
