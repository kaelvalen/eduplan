// Re-export from db.ts for backwards compatibility
export { prisma, isTurso, db, query, execute } from './db';
export { prisma as default } from './db';
