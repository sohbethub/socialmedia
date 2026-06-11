import { PrismaClient } from "@prisma/client";

// Geliştirme sırasında hot-reload'da çoklu bağlantı açılmasını önler.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
