import type { APIRoute } from 'astro';
import { db } from '@/db/client';
import { cannedResponses } from '@/db/schema';
import { validateSessionToken } from '@/lib/auth';

/**
 * GET /api/canned-responses
 * Get all canned responses
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get('x-session-token');
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await validateSessionToken(token);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let responses;
    if (category) {
      responses = await db.query.cannedResponses.findMany({
        where: (cr, { eq }) => eq(cr.category, category),
      });
    } else {
      responses = await db.query.cannedResponses.findMany();
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responses,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching canned responses:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch canned responses',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
