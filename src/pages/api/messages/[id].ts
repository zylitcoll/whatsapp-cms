import type { APIRoute } from 'astro';
import { db } from '@/db/client';
import { messages, contacts } from '@/db/schema';
import { validateSessionToken } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/messages/:contactId
 * Get conversation history for a specific contact
 */
export const GET: APIRoute = async ({ request, params }) => {
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

    const { contactId } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get contact
    const contact = await db.query.contacts.findFirst({
      where: (c, { eq }) => eq(c.id, contactId as string),
    });

    if (!contact) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contact not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get messages
    const allMessages = await db.query.messages.findMany({
      where: (m, { eq }) => eq(m.contactId, contactId as string),
      orderBy: (m) => desc(m.timestamp),
    });

    const paginatedMessages = allMessages
      .reverse()
      .slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          contact,
          messages: paginatedMessages,
        },
        pagination: {
          limit,
          offset,
          total: allMessages.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch conversation',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
