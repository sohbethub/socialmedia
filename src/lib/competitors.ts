// Rakip kanal takibi (YouTube): herkese açık kanal istatistiklerini çeker.
// Bağlı YouTube hesabının OAuth yetkisi kullanılır (ek izin gerekmez —
// herkese açık veriler okunur).
import { db } from "./db";
import { getValidAccessToken } from "./google";

const API = "https://www.googleapis.com/youtube/v3";
const DAY = 24 * 60 * 60 * 1000;

async function ytGet<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const res = await fetch(`${API}/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`YouTube API ${path} hatası (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Bağlı ilk YouTube hesabının erişim anahtarını döndürür. */
async function anyYouTubeToken(): Promise<string> {
  const account = await db.account.findFirst({
    where: { platform: "YOUTUBE", accessToken: { not: null } },
  });
  if (!account) {
    throw new Error("Rakip takibi için önce Hesaplar sayfasından bir YouTube kanalı bağlayın.");
  }
  return getValidAccessToken(account.id);
}

/**
 * Kullanıcının yapıştırdığı girdiden kanal sorgu parametresi çıkarır.
 * Desteklenen biçimler: kanal URL'si (youtube.com/@handle, /channel/UC...),
 * @handle, ya da düz kanal kimliği (UC...).
 */
function parseChannelInput(raw: string): { id?: string; forHandle?: string } {
  const input = raw.trim();

  const channelMatch = input.match(/channel\/(UC[\w-]{20,})/);
  if (channelMatch) return { id: channelMatch[1] };

  if (/^UC[\w-]{20,}$/.test(input)) return { id: input };

  const handleMatch = input.match(/@([\w.\-]+)/);
  if (handleMatch) return { forHandle: "@" + handleMatch[1] };

  // youtube.com/adsoyad gibi eski özel URL'ler handle olarak denenir
  const tail = input.split("/").filter(Boolean).pop();
  if (tail) return { forHandle: "@" + tail };

  throw new Error("Kanal adresi anlaşılamadı. Kanal URL'sini veya @kullaniciadi biçimini girin.");
}

interface ChannelInfo {
  id: string;
  title: string;
  handle: string | null;
  subscribers: number;
  totalViews: bigint;
  videoCount: number;
  uploadsPlaylist: string;
}

interface YtChannelsResponse {
  items?: {
    id: string;
    snippet: { title: string; customUrl?: string };
    statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    contentDetails: { relatedPlaylists: { uploads: string } };
  }[];
}

async function fetchChannel(
  token: string,
  query: { id?: string; forHandle?: string },
): Promise<ChannelInfo> {
  const data = await ytGet<YtChannelsResponse>(
    "channels",
    {
      part: "snippet,statistics,contentDetails",
      ...(query.id ? { id: query.id } : {}),
      ...(query.forHandle ? { forHandle: query.forHandle } : {}),
    },
    token,
  );
  const ch = data.items?.[0];
  if (!ch) throw new Error("Kanal bulunamadı — adresi kontrol edin.");
  return {
    id: ch.id,
    title: ch.snippet.title,
    handle: ch.snippet.customUrl ?? null,
    subscribers: Number(ch.statistics.subscriberCount ?? 0),
    totalViews: BigInt(ch.statistics.viewCount ?? 0),
    videoCount: Number(ch.statistics.videoCount ?? 0),
    uploadsPlaylist: ch.contentDetails.relatedPlaylists.uploads,
  };
}

/** Son 30 gündeki video sayısı ve son 5 videonun ortalama izlenmesi. */
async function fetchRecentActivity(
  token: string,
  uploadsPlaylist: string,
): Promise<{ recentVideos30d: number; recentAvgViews: number }> {
  const page = await ytGet<{
    items?: { contentDetails: { videoId: string; videoPublishedAt?: string } }[];
  }>(
    "playlistItems",
    { part: "contentDetails", playlistId: uploadsPlaylist, maxResults: "15" },
    token,
  );

  const items = page.items ?? [];
  const since = Date.now() - 30 * DAY;
  const recentVideos30d = items.filter(
    (i) => i.contentDetails.videoPublishedAt && new Date(i.contentDetails.videoPublishedAt).getTime() >= since,
  ).length;

  const lastFive = items.slice(0, 5).map((i) => i.contentDetails.videoId);
  let recentAvgViews = 0;
  if (lastFive.length > 0) {
    const stats = await ytGet<{ items?: { statistics: { viewCount?: string } }[] }>(
      "videos",
      { part: "statistics", id: lastFive.join(",") },
      token,
    );
    const views = (stats.items ?? []).map((v) => Number(v.statistics.viewCount ?? 0));
    if (views.length > 0) {
      recentAvgViews = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
    }
  }

  return { recentVideos30d, recentAvgViews };
}

async function snapshotChannel(token: string, competitorId: string, channelId: string) {
  const info = await fetchChannel(token, { id: channelId });
  const recent = await fetchRecentActivity(token, info.uploadsPlaylist);
  await db.competitorSnapshot.create({
    data: {
      competitorId,
      subscribers: info.subscribers,
      totalViews: info.totalViews,
      videoCount: info.videoCount,
      ...recent,
    },
  });
  // Kanal adı değişmiş olabilir
  await db.competitor.update({
    where: { id: competitorId },
    data: { name: info.title, handle: info.handle },
  });
}

/** Yeni rakip ekler ve ilk anlık görüntüsünü alır. */
export async function addCompetitor(input: string): Promise<string> {
  const token = await anyYouTubeToken();
  const info = await fetchChannel(token, parseChannelInput(input));

  const existing = await db.competitor.findUnique({
    where: { platform_externalId: { platform: "YOUTUBE", externalId: info.id } },
  });
  if (existing) throw new Error(`"${info.title}" zaten takip listende.`);

  const competitor = await db.competitor.create({
    data: {
      platform: "YOUTUBE",
      externalId: info.id,
      name: info.title,
      handle: info.handle,
    },
  });
  await snapshotChannel(token, competitor.id, info.id);
  return info.title;
}

/**
 * Tüm rakiplerin (ve kıyas için kendi kanalının) istatistiklerini günceller.
 * Kendi kanalı için isSelf=true satırı yoksa oluşturulur.
 */
export async function refreshCompetitors(): Promise<{ updated: number; errors: string[] }> {
  const token = await anyYouTubeToken();

  // Kendi kanalını kıyas satırı olarak ekle/güncelle
  const ownAccount = await db.account.findFirst({
    where: { platform: "YOUTUBE", accessToken: { not: null } },
  });
  if (ownAccount) {
    await db.competitor.upsert({
      where: {
        platform_externalId: { platform: "YOUTUBE", externalId: ownAccount.externalId },
      },
      create: {
        platform: "YOUTUBE",
        externalId: ownAccount.externalId,
        name: ownAccount.displayName,
        isSelf: true,
      },
      update: { isSelf: true },
    });
  }

  const competitors = await db.competitor.findMany({ where: { platform: "YOUTUBE" } });
  const errors: string[] = [];
  let updated = 0;
  for (const c of competitors) {
    try {
      await snapshotChannel(token, c.id, c.externalId);
      updated++;
    } catch (e) {
      errors.push(`${c.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}
