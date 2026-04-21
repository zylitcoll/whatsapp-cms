import type { APIRoute } from 'astro';
import { db } from '@/db/client';
import { templates } from '@/db/schema';
import { validateSessionToken } from '@/lib/auth';

/**
 * GET /api/templates
 * Get all WhatsApp templates
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
    const approved = url.searchParams.get('approved');

    let templatesData;
    if (approved === 'true') {
      templatesData = await db.query.templates.findMany({
        where: (t, { eq }) => eq(t.isApproved, true),
      });
    } else {
      templatesData = await db.query.templates.findMany();
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: templatesData,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch templates',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
