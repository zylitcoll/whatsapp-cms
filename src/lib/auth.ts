import crypto from 'crypto';
import { db } from '@/db/client';
import { sessions } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

/**
 * Hash password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  expiresInHours: number = 24
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Validate session token
 */
export async function validateSessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const session = await db.query.sessions.findFirst({
      where: (sessions, { eq, and, gt }) =>
        and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
    });

    if (!session) {
      return null;
    }

    return { userId: session.userId };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Logout - invalidate session
 */
export async function logout(token: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Get session from request
 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...v] = c.split('=');
      return [key.trim(), decodeURIComponent(v.join('='))];
    })
  );

  return cookies['session_token'] || null;
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string): string {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `session_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expiresAt.toUTCString()}`;
}
