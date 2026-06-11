// Platformlardan bağımsız ortak tipler ve istemci arayüzü.
// YouTube, Instagram (ve ileride başka platformlar) bu arayüzü uygular.

export type Platform = "YOUTUBE" | "INSTAGRAM";

export type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "QUESTION";

export interface PlatformPost {
  externalId: string;
  title: string;
  description?: string;
  permalink?: string;
  publishedAt: Date;
}

export interface PlatformMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface PlatformComment {
  externalId: string;
  authorName: string;
  text: string;
  publishedAt: Date;
}

export interface PublishDraft {
  title: string;
  description?: string;
  mediaPath?: string;
}

export interface PlatformClient {
  readonly platform: Platform;

  /** Hesaptaki içerikleri (video/medya) listeler. */
  getPosts(): Promise<PlatformPost[]>;

  /** Bir içeriğin anlık metriklerini döndürür. */
  getMetrics(postExternalId: string): Promise<PlatformMetrics>;

  /** Bir içeriğe gelen yorumları listeler. */
  getComments(postExternalId: string): Promise<PlatformComment[]>;

  /** Bir yoruma yanıt gönderir. */
  replyToComment(commentExternalId: string, text: string): Promise<void>;

  /** Planlı paylaşımı yayınlar; platformdaki yeni içerik kimliğini döndürür. */
  publishPost(draft: PublishDraft): Promise<string>;
}
