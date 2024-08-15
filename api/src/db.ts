import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const healthy = new Promise<boolean>((resolve) => {
  try {
    prisma.$queryRaw`SELECT 1;`;
    resolve(true);
  } catch (e) {
    console.error("DB:HEALTH", e);
    resolve(false);
  }
});
