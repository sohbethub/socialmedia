import type {
  PlatformClient,
  PlatformPost,
  PlatformMetrics,
  PlatformComment,
  PublishDraft,
} from "./types";

// YouTube Data API v3 istemcisi — Faz 2'de doldurulacak.
//
// Gerekenler:
// - Google Cloud projesi + YouTube Data API v3 etkin
// - OAuth 2.0 istemcisi (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
// - "offline" erişim ile refresh token alınıp Account kaydında saklanır
//
// Kullanılacak uçlar:
// - channels.list (mine=true)          → kanal bilgisi
// - search.list / playlistItems.list   → video listesi
// - videos.list (part=statistics)      → metrikler
// - commentThreads.list                → yorumlar
// - comments.insert                    → yorum yanıtlama
// - videos.insert (resumable upload)   → video yayınlama
export class YouTubeClient implements PlatformClient {
  readonly platform = "YOUTUBE" as const;

  constructor(private accessToken: string) {}

  async getPosts(): Promise<PlatformPost[]> {
    throw new Error("YouTube entegrasyonu henüz uygulanmadı (Faz 2)");
  }

  async getMetrics(_postExternalId: string): Promise<PlatformMetrics> {
    throw new Error("YouTube entegrasyonu henüz uygulanmadı (Faz 2)");
  }

  async getComments(_postExternalId: string): Promise<PlatformComment[]> {
    throw new Error("YouTube entegrasyonu henüz uygulanmadı (Faz 2)");
  }

  async replyToComment(_commentExternalId: string, _text: string): Promise<void> {
    throw new Error("YouTube entegrasyonu henüz uygulanmadı (Faz 2)");
  }

  async publishPost(_draft: PublishDraft): Promise<string> {
    throw new Error("YouTube entegrasyonu henüz uygulanmadı (Faz 2)");
  }
}
