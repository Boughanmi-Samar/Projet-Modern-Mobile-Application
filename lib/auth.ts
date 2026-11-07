import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_dev_secure_change_in_production'
);

const TOKEN_COOKIE_NAME = 'uniconnect_token';

export interface SessionPayload {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  groupeId?: string;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  if (typeof plain !== 'string' || typeof hashed !== 'string' || hashed.length === 0) {
    return false;
  }

  return bcrypt.compare(plain, hashed);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      nom: payload.nom as string,
      role: payload.role as UserRole,
      groupeId: payload.groupeId as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect(session.role === 'admin' ? '/admin' : session.role === 'teacher' ? '/teacher' : '/student');
  }

  return session;
}
