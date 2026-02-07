import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken, hashPassword } from '@/lib/auth';
import { authRateLimit } from '@/middleware/rate-limit';

interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
}

async function findUser(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } });
}

async function countUsers(): Promise<number> {
  return prisma.user.count();
}

async function createDemoUsers(adminHash: string, teacherHash: string): Promise<void> {
  await prisma.user.createMany({
    data: [
      { username: 'admin', passwordHash: adminHash, role: 'admin' },
      { username: 'teacher', passwordHash: teacherHash, role: 'teacher' },
    ],
  });
}

async function handleLogin(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { detail: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Find user
    let user = await findUser(username);

    // If no users exist, create demo users
    if (!user) {
      const userCount = await countUsers();
      if (userCount === 0) {
        // Create demo users
        const adminHash = await hashPassword('admin123');
        const teacherHash = await hashPassword('teacher123');
        await createDemoUsers(adminHash, teacherHash);

        // Try to find user again
        user = await findUser(username);
      }
    }

    if (!user) {
      return NextResponse.json(
        { detail: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { detail: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Giriş yapılırken bir hata oluştu: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Apply rate limiting to login endpoint (5 attempts per 15 minutes)
export const POST = authRateLimit(handleLogin);
