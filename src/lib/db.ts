/**
 * Database Client Configuration
 *
 * Uses Prisma ORM exclusively for all database operations.
 * Supports SQLite for local development and PostgreSQL for production.
 *
 * REFACTORED: Removed dual database support (Turso) - saved 1600+ lines of duplicate code
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma instances in development (hot reload issue)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimizations
const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Cache Prisma client in development to prevent connection exhaustion
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

/**
 * Export Prisma client as default database interface
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@/lib/db';
 *
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma = prismaClient;

/**
 * Default export for convenience
 */
export default prisma;

/**
 * Helper function to run raw SQL queries (use sparingly, prefer Prisma methods)
 *
 * @example
 * ```typescript
 * const results = await query<User>('SELECT * FROM User WHERE role = ?', ['admin']);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  return prismaClient.$queryRawUnsafe<T[]>(sql, ...params);
}

/**
 * Helper to execute raw SQL mutations (use sparingly, prefer Prisma methods)
 *
 * @example
 * ```typescript
 * await execute('UPDATE User SET isActive = ? WHERE id = ?', [true, 1]);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params: any[] = []): Promise<any> {
  return prismaClient.$executeRawUnsafe(sql, ...params);
}

/**
 * Graceful shutdown - disconnect Prisma on process termination
 */
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
  });
}
