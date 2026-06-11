import type {
  PlatformClient,
  PlatformPost,
  PlatformMetrics,
  PlatformComment,
  PublishDraft,
} from "./types";

// Instagram (Meta Graph API) istemcisi — Faz 3'te doldurulacak.
//
// Gerekenler:
// - Instagram Business/Creator hesabı + bağlı Facebook sayfası
// - Meta uygulaması (META_APP_ID / META_APP_SECRET) ve uygulama incelemesi
// - Uzun ömürlü erişim anahtarı (~60 gün, periyodik yenilenir)
//
// Kullanılacak uçlar:
// - /{ig-user-id}/media                    → medya listesi
// - /{media-id}/insights                   → metrikler (reach, plays, saved...)
// - /{media-id}/comments                   → yorumlar
// - /{comment-id}/replies (POST)           → yorum yanıtlama
// - /{ig-user-id}/media + media_publish    → içerik yayınlama (content publishing)
export class InstagramClient implements PlatformClient {
  readonly platform = "INSTAGRAM" as const;

  constructor(private accessToken: string) {}

  async getPosts(): Promise<PlatformPost[]> {
    throw new Error("Instagram entegrasyonu henüz uygulanmadı (Faz 3)");
  }

  async getMetrics(_postExternalId: string): Promise<PlatformMetrics> {
    throw new Error("Instagram entegrasyonu henüz uygulanmadı (Faz 3)");
  }

  async getComments(_postExternalId: string): Promise<PlatformComment[]> {
    throw new Error("Instagram entegrasyonu henüz uygulanmadı (Faz 3)");
  }

  async replyToComment(_commentExternalId: string, _text: string): Promise<void> {
    throw new Error("Instagram entegrasyonu henüz uygulanmadı (Faz 3)");
  }

  async publishPost(_draft: PublishDraft): Promise<string> {
    throw new Error("Instagram entegrasyonu henüz uygulanmadı (Faz 3)");
  }
}
