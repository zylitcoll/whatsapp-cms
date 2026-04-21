import type { APIRoute } from 'astro';
import { logout } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout endpoint
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get('x-session-token');

    if (token) {
      await logout(token);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session_token=; Path=/; Max-Age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error during logout:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Logout failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
