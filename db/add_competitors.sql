-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'YOUTUBE',
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSnapshot" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscribers" INTEGER NOT NULL DEFAULT 0,
    "totalViews" BIGINT NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "recentVideos30d" INTEGER NOT NULL DEFAULT 0,
    "recentAvgViews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompetitorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_platform_externalId_key" ON "Competitor"("platform", "externalId");

-- CreateIndex
CREATE INDEX "CompetitorSnapshot_competitorId_capturedAt_idx" ON "CompetitorSnapshot"("competitorId", "capturedAt");

-- AddForeignKey
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

