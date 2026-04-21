import type { APIRoute } from 'astro';
import { hashPassword, createSession } from '@/lib/auth';

interface LoginRequest {
  username: string;
  password: string;
}

/**
 * POST /api/auth/login
 * Login endpoint
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Helper to get env vars
    const getEnv = (key: string) => {
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
      }
      return undefined;
    };

    // Check credentials (plain text matching)
    const adminUsername = getEnv('ADMIN_USERNAME') || 'admin';
    const adminPassword = getEnv('ADMIN_PASSWORD') || 'password';

    console.log(`[Auth Debug] Attempting login for username: ${username}`);
    console.log(`[Auth Debug] Expected vs Provided Username: ${adminUsername} vs ${username}`);
    console.log(`[Auth Debug] Expected vs Provided Password: ${adminPassword} vs ${password}`);

    if (username !== adminUsername || password !== adminPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials',
          debug: {
            userMatch: username === adminUsername,
            passMatch: password === adminPassword
          } 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session
    const sessionToken = await createSession(username, 24);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionToken,
          username,
          role: 'admin',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_token=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error during login:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Login failed',
        details: error.toString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
