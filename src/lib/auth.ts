import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, prisma, isTurso } from './db';
import type { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function getCurrentUser(request: Request): Promise<User & { id: number } | null> {
  const token = await getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  if (isTurso && db) {
    const result = await db.execute({
      sql: 'SELECT id, username, role FROM User WHERE id = ?',
      args: [payload.userId],
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    const role = (row.role as 'admin' | 'teacher') || 'teacher';
    return {
      id: row.id as number,
      username: row.username as string,
      role: role,
      permissions: role === 'admin' ? ['admin'] : ['teacher'],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user) return null;

  const role = (user.role as 'admin' | 'teacher') || 'teacher';
  return {
    id: user.id,
    username: user.username,
    role: role,
    permissions: role === 'admin' ? ['admin'] : ['teacher'],
  };
}

export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === 'admin';
}
