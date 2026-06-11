// Demo verisi: API anahtarı olmadan arayüzü geliştirebilmek için
// örnek hesaplar, içerikler, metrikler, yorumlar ve öneriler oluşturur.
// Çalıştırma: npm run db:seed
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY);
}

async function main() {
  await db.insight.deleteMany();
  await db.scheduledPost.deleteMany();
  await db.account.deleteMany(); // cascade: post, metric, comment

  const youtube = await db.account.create({
    data: {
      platform: "YOUTUBE",
      externalId: "UC_demo_channel",
      displayName: "Demo Kanal",
    },
  });

  const instagram = await db.account.create({
    data: {
      platform: "INSTAGRAM",
      externalId: "ig_demo_account",
      displayName: "@demohesap",
    },
  });

  const videos = [
    { title: "Evde 10 Dakikada Kahvaltı Tarifi", days: 45, base: 12400 },
    { title: "Vlog: İstanbul'da Bir Gün", days: 30, base: 8200 },
    { title: "Kamera Arkası: Stüdyo Kurulumu", days: 21, base: 15600 },
    { title: "Soru-Cevap: Kanal Nasıl Büyür?", days: 14, base: 22300 },
    { title: "Yeni Ekipman Kutu Açılışı", days: 7, base: 9800 },
    { title: "1 Haftada Video Kurgusu Öğren", days: 3, base: 31500 },
  ];

  for (const [i, v] of videos.entries()) {
    const post = await db.post.create({
      data: {
        accountId: youtube.id,
        externalId: `yt_video_${i}`,
        title: v.title,
        permalink: `https://youtube.com/watch?v=demo${i}`,
        publishedAt: daysAgo(v.days),
      },
    });

    // Yayından bugüne günlük metrik anlık görüntüleri (büyüyen eğri)
    for (let d = v.days; d >= 0; d--) {
      const progress = (v.days - d + 1) / (v.days + 1);
      const views = Math.round(v.base * Math.sqrt(progress));
      await db.metricSnapshot.create({
        data: {
          postId: post.id,
          capturedAt: daysAgo(d),
          views,
          likes: Math.round(views * 0.06),
          comments: Math.round(views * 0.008),
          shares: Math.round(views * 0.004),
        },
      });
    }
  }

  const igPosts = [
    { title: "Reels: Hızlı Kurgu İpuçları", days: 10, base: 5400 },
    { title: "Reels: Günün Kamera Arkası", days: 5, base: 7100 },
    { title: "Reels: Yeni Video Duyurusu", days: 1, base: 2900 },
  ];

  for (const [i, p] of igPosts.entries()) {
    const post = await db.post.create({
      data: {
        accountId: instagram.id,
        externalId: `ig_media_${i}`,
        title: p.title,
        permalink: `https://instagram.com/p/demo${i}`,
        publishedAt: daysAgo(p.days),
      },
    });

    for (let d = p.days; d >= 0; d--) {
      const progress = (p.days - d + 1) / (p.days + 1);
      const views = Math.round(p.base * Math.sqrt(progress));
      await db.metricSnapshot.create({
        data: {
          postId: post.id,
          capturedAt: daysAgo(d),
          views,
          likes: Math.round(views * 0.09),
          comments: Math.round(views * 0.012),
          saves: Math.round(views * 0.02),
        },
      });
    }
  }

  // Örnek yorumlar (yanıt bekleyenler dahil)
  const lastVideo = await db.post.findFirstOrThrow({
    where: { externalId: "yt_video_5" },
  });
  const lastReel = await db.post.findFirstOrThrow({
    where: { externalId: "ig_media_2" },
  });

  const comments = [
    {
      postId: lastVideo.id,
      externalId: "c1",
      authorName: "Ayşe K.",
      text: "Harika anlatım, çok teşekkürler! Devamı gelecek mi?",
      sentiment: "POSITIVE",
      days: 2,
    },
    {
      postId: lastVideo.id,
      externalId: "c2",
      authorName: "Mehmet T.",
      text: "Hangi kurgu programını kullanıyorsunuz?",
      sentiment: "QUESTION",
      days: 1,
    },
    {
      postId: lastVideo.id,
      externalId: "c3",
      authorName: "Zeynep A.",
      text: "Ses biraz düşük geldi, sonraki videoda dikkat eder misiniz?",
      sentiment: "NEGATIVE",
      days: 1,
    },
    {
      postId: lastReel.id,
      externalId: "c4",
      authorName: "Can B.",
      text: "Bu geçiş efektini nasıl yaptınız? 🔥",
      sentiment: "QUESTION",
      days: 0,
    },
  ];

  for (const c of comments) {
    await db.comment.create({
      data: {
        postId: c.postId,
        externalId: c.externalId,
        authorName: c.authorName,
        text: c.text,
        sentiment: c.sentiment,
        publishedAt: daysAgo(c.days),
      },
    });
  }

  // Planlı paylaşımlar
  await db.scheduledPost.createMany({
    data: [
      {
        accountId: youtube.id,
        title: "Kurgu Serisi Bölüm 2: Renk Düzenleme",
        description: "1 Haftada Video Kurgusu serisinin devamı",
        scheduledAt: new Date(Date.now() + 2 * DAY),
        status: "SCHEDULED",
      },
      {
        accountId: instagram.id,
        title: "Reels: Bölüm 2 Fragmanı",
        scheduledAt: new Date(Date.now() + 1 * DAY),
        status: "SCHEDULED",
      },
      {
        accountId: youtube.id,
        title: "Stüdyo Turu (taslak)",
        scheduledAt: new Date(Date.now() + 7 * DAY),
        status: "DRAFT",
      },
    ],
  });

  // Örnek büyüme önerileri
  await db.insight.createMany({
    data: [
      {
        kind: "BEST_TIME",
        title: "En iyi paylaşım zamanı: Perşembe 19:00",
        body: "Son 30 günde Perşembe akşamı yayınlanan içerikler, ortalamadan %42 daha fazla izlenme aldı. Bir sonraki videoyu Perşembe 19:00'da planlamayı deneyin.",
      },
      {
        kind: "CONTENT_TYPE",
        title: "Eğitim içerikleri en iyi performansı gösteriyor",
        body: "'1 Haftada Video Kurgusu Öğren' videosu, kanal ortalamasının 2,5 katı izlenme aldı. 'Nasıl yapılır' formatındaki içeriklere ağırlık vermek büyümeyi hızlandırabilir.",
      },
      {
        kind: "ENGAGEMENT",
        title: "Yanıtlanmamış 4 yorum var",
        body: "İlk 24 saat içinde yanıtlanan yorumlar etkileşimi artırır ve algoritmaya olumlu sinyal verir. Yorumlar sayfasından bekleyen yanıtları tamamlayın.",
      },
    ],
  });

  console.log("Demo verisi yüklendi ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
