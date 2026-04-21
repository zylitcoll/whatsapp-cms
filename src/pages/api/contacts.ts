import type { APIRoute } from 'astro';
import { db } from '@/db/client';
import { contacts, messages as messagesTable } from '@/db/schema';
import { validateSessionToken } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/contacts
 * Get list of all contacts with their latest message
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    let query = db.query.contacts.findMany();

    // Add search filter if provided
    if (search) {
      query = db.query.contacts.findMany({
        where: (c, { or, like }) =>
          or(
            like(c.phoneNumber, `%${search}%`),
            like(c.displayName || '', `%${search}%`)
          ),
      });
    }

    const allContacts = await query;

    // Get latest message for each contact
    const contactsWithMessages = await Promise.all(
      allContacts.slice(offset, offset + limit).map(async (contact) => {
        const latestMessage = await db.query.messagesTable.findFirst({
          where: (m, { eq }) => eq(m.contactId, contact.id),
          orderBy: (m) => desc(m.timestamp),
        });

        return {
          ...contact,
          latestMessage: latestMessage || null,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: contactsWithMessages,
        pagination: {
          limit,
          offset,
          total: allContacts.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch contacts',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
