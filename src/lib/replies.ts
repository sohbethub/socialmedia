// Yorum sınıflandırma ve kural tabanlı yanıt taslakları (ücretsiz, API'siz).

export type Sentiment = "POSITIVE" | "NEGATIVE" | "QUESTION" | "NEUTRAL";

const QUESTION_HINTS = [
  "nasıl", "hangi", "ne zaman", "nerede", "kaç", "neden", "niye",
  "var mı", "mi ", "mı ", "mu ", "mü ", "musun", "misin",
];
const POSITIVE_HINTS = [
  "harika", "süper", "mükemmel", "teşekkür", "güzel", "bayıldım", "muhteşem",
  "başarılı", "sevdim", "helal", "tebrik", "👏", "🔥", "❤", "😍", "💯",
];
const NEGATIVE_HINTS = [
  "kötü", "beğenmedim", "olmamış", "berbat", "yetersiz", "sorun", "hata",
  "maalesef", "düşük", "sıkıcı", "anlaşılmıyor", "duyulmuyor", "👎",
];

export function classifySentiment(text: string): Sentiment {
  const t = text.toLowerCase();
  if (t.includes("?") || QUESTION_HINTS.some((h) => t.includes(h))) return "QUESTION";
  if (NEGATIVE_HINTS.some((h) => t.includes(h))) return "NEGATIVE";
  if (POSITIVE_HINTS.some((h) => t.includes(h))) return "POSITIVE";
  return "NEUTRAL";
}

/** Yoruma uygun, düzenlenebilir bir yanıt taslağı üretir. */
export function buildReplyDraft(authorName: string, sentiment: string | null): string {
  // "Ayşe K." -> "Ayşe"
  const first = authorName.split(" ")[0] || authorName;

  switch (sentiment) {
    case "QUESTION":
      return `Merhaba ${first}, sorun için teşekkürler! `;
    case "POSITIVE":
      return `Çok teşekkürler ${first}! 🙏 Desteğin bizim için çok değerli, yeni içerikler yolda!`;
    case "NEGATIVE":
      return `Geri bildirimin için teşekkürler ${first}. Haklısın, bunu bir sonraki içerikte düzeltmek için not aldım. 🙏`;
    default:
      return `Yorumun için teşekkürler ${first}! 🙂`;
  }
}
