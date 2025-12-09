import { createClient, Client } from '@libsql/client';
import { PrismaClient } from '@prisma/client';

// Turso client for production
let tursoClient: Client | null = null;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// Prisma client for local development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

// Export based on environment
export const isTurso = !!tursoClient;
export const db = tursoClient;
export const prisma = prismaClient;

// Helper function to run queries
export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (tursoClient) {
    const result = await tursoClient.execute({ sql, args: params });
    return result.rows as T[];
  }
  // Fallback to Prisma raw query
  return prismaClient.$queryRawUnsafe(sql, ...params);
}

// Helper to execute mutations
export async function execute(sql: string, params: any[] = []) {
  if (tursoClient) {
    return tursoClient.execute({ sql, args: params });
  }
  return prismaClient.$executeRawUnsafe(sql, ...params);
}
