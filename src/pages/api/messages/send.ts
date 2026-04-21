import type { APIRoute } from 'astro';
import { metaApi } from '@/lib/meta-api';
import { db } from '@/db/client';
import { messages, contacts } from '@/db/schema';
import { validateSessionToken } from '@/lib/auth';
import crypto from 'crypto';

interface SendMessageRequest {
  recipientPhoneNumber: string;
  messageText?: string;
  templateName?: string;
  templateVariables?: string[];
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaCaption?: string;
}

/**
 * POST /api/messages/send
 * Send message via WhatsApp API
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify session
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

    // Parse request body
    const body: SendMessageRequest = await request.json();
    const { recipientPhoneNumber, messageText, templateName, templateVariables, mediaType, mediaUrl, mediaCaption } = body;

    if (!recipientPhoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient phone number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let messageResult: { messageId: string; success: boolean };

    // Send appropriate message type
    if (messageText) {
      messageResult = await metaApi.sendTextMessage(recipientPhoneNumber, messageText);
    } else if (templateName) {
      messageResult = await metaApi.sendTemplateMessage({
        recipientPhoneNumber,
        templateName,
        templateLanguage: 'en',
        templateVariables,
      });
    } else if (mediaType && mediaUrl) {
      messageResult = await metaApi.sendMediaMessage(
        recipientPhoneNumber,
        mediaType,
        mediaUrl,
        mediaCaption
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'No message content provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create contact
    let contact = await db.query.contacts.findFirst({
      where: (c, { eq }) => eq(c.phoneNumber, recipientPhoneNumber),
    });

    if (!contact) {
      const newContact = await db
        .insert(contacts)
        .values({
          id: crypto.randomUUID(),
          phoneNumber: recipientPhoneNumber,
          label: 'customer',
        })
        .returning();

      contact = Array.isArray(newContact) ? newContact[0] : newContact;
    }

    // Store message in database
    const messageContent: Record<string, any> = {};
    let messageTypeDb = 'text';

    if (messageText) {
      messageTypeDb = 'text';
      messageContent.body = messageText;
    } else if (templateName) {
      messageTypeDb = 'template';
      messageContent.name = templateName;
      messageContent.variables = templateVariables || [];
    } else if (mediaType) {
      messageTypeDb = mediaType;
      messageContent.url = mediaUrl;
      if (mediaCaption) messageContent.caption = mediaCaption;
    }

    await db.insert(messages).values({
      id: messageResult.messageId,
      contactId: contact.id,
      messageType: messageTypeDb,
      content: messageContent,
      direction: 'outbound',
      status: 'sent',
      timestamp: Math.floor(Date.now() / 1000),
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          messageId: messageResult.messageId,
          recipient: recipientPhoneNumber,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send message',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
