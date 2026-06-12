// Meta (Facebook/Instagram) OAuth yardımcıları.
// Instagram Graph API'si, Facebook sayfasına bağlı Business/Creator
// hesaplarla çalışır; OAuth akışı Facebook Login üzerinden yürür.
import type { Account } from "@prisma/client";

const GRAPH = "https://graph.facebook.com/v23.0";
const DIALOG = "https://www.facebook.com/v23.0/dialog/oauth";

const SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
];

function clientCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID ve META_APP_SECRET .env dosyasında tanımlı olmalı");
  }
  return { appId, appSecret };
}

export function metaConfigured(): boolean {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function metaRedirectUri(origin: string) {
  return `${origin}/api/auth/meta/callback`;
}

export function buildMetaAuthUrl(origin: string, state: string) {
  const { appId } = clientCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: metaRedirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${DIALOG}?${params}`;
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${GRAPH}/${path}?${new URLSearchParams(params)}`);
  if (!res.ok) {
    throw new Error(`Meta API ${path} hatası (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Yetki kodunu kısa ömürlü, ardından uzun ömürlü (~60 gün) tokena çevirir. */
export async function exchangeMetaCode(
  code: string,
  origin: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const { appId, appSecret } = clientCredentials();

  const shortLived = await graphGet<{ access_token: string }>("oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: metaRedirectUri(origin),
    code,
  });

  const longLived = await graphGet<{ access_token: string; expires_in?: number }>(
    "oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLived.access_token,
    },
  );

  const expiresIn = longLived.expires_in ?? 60 * 24 * 60 * 60; // ~60 gün
  return {
    accessToken: longLived.access_token,
    expiresAt: new Date(Date.now() + (expiresIn - 24 * 60 * 60) * 1000), // 1 gün pay
  };
}

export interface IgAccountInfo {
  igUserId: string;
  username: string;
}

/** Kullanıcının sayfalarından Instagram Business hesabını bulur. */
export async function findInstagramAccount(accessToken: string): Promise<IgAccountInfo> {
  const pages = await graphGet<{
    data?: {
      name: string;
      instagram_business_account?: { id: string; username?: string };
    }[];
  }>("me/accounts", {
    fields: "name,instagram_business_account{id,username}",
    access_token: accessToken,
  });

  const page = (pages.data ?? []).find((p) => p.instagram_business_account);
  if (!page?.instagram_business_account) {
    throw new Error(
      "Instagram Business hesabı bulunamadı. Instagram hesabınızın bir Facebook sayfasına bağlı olduğundan emin olun.",
    );
  }
  return {
    igUserId: page.instagram_business_account.id,
    username: page.instagram_business_account.username ?? page.name,
  };
}

/**
 * Hesabın geçerli Meta tokenını döndürür. Uzun ömürlü token sunucu tarafında
 * yenilenemez (kullanıcı etkileşimi gerekir); süresi dolunca yeniden bağlanmalı.
 */
export function getMetaToken(account: Account): string {
  if (!account.accessToken) {
    throw new Error(`Instagram hesabı bağlı değil: ${account.displayName}`);
  }
  if (account.tokenExpiry && account.tokenExpiry.getTime() < Date.now()) {
    throw new Error(
      `Instagram erişiminin süresi doldu — Hesaplar sayfasından "${account.displayName}" hesabını yeniden bağlayın.`,
    );
  }
  return account.accessToken;
}
