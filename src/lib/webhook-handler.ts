import type { MetaWebhookEvent, MetaWebhookChange } from '@/types/index';
import { db } from '@/db/client';
import { messages, contacts } from '@/db/schema';
import { metaApi } from './meta-api';
import crypto from 'crypto';

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  verifyToken: string
): boolean {
  const hash = crypto
    .createHmac('sha256', verifyToken)
    .update(body)
    .digest('hex');

  return `sha256=${hash}` === signature;
}

/**
 * Process incoming webhook events from Meta
 */
export async function processWebhookEvent(event: MetaWebhookEvent): Promise<void> {
  try {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await handleMessageChange(change);
        } else if (change.field === 'message_status') {
          await handleMessageStatusChange(change);
        }
      }
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

/**
 * Handle incoming message
 */
async function handleMessageChange(change: MetaWebhookChange): Promise<void> {
  const value = change.value;
  const messages_data = value.messages;
  const contacts_data = value.contacts;

  if (!messages_data || !messages_data.length) return;

  for (const message of messages_data) {
    const fromPhoneNumber = message.from;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000;

    // Get or create contact
    let contact = await db.query.contacts.findFirst({
      where: (contacts, { eq }) => eq(contacts.phoneNumber, fromPhoneNumber),
    });

    if (!contact) {
      const contactName =
        contacts_data?.find((c) => c.wa_id === fromPhoneNumber)?.profile?.name || 'Unknown';

      contact = (
        await db.insert(contacts).values({
          id: crypto.randomUUID(),
          phoneNumber: fromPhoneNumber,
          displayName: contactName,
          label: 'other',
        })
      ).returning();

      if (Array.isArray(contact)) {
        contact = contact[0];
      }
    }

    // Store message
    const messageContent: Record<string, any> = {};
    let messageType = 'text';

    if (message.text) {
      messageType = 'text';
      messageContent.body = message.text.body;
    } else if (message.image) {
      messageType = 'image';
      messageContent.id = message.image.id;
    } else if (message.video) {
      messageType = 'video';
      messageContent.id = message.video.id;
    } else if (message.audio) {
      messageType = 'audio';
      messageContent.id = message.audio.id;
    } else if (message.document) {
      messageType = 'document';
      messageContent.id = message.document.id;
      messageContent.filename = message.document.filename;
    } else if (message.location) {
      messageType = 'location';
      messageContent.latitude = message.location.latitude;
      messageContent.longitude = message.location.longitude;
    }

    // Store message in database
    await db.insert(messages).values({
      id: messageId,
      contactId: contact.id,
      messageType,
      content: messageContent,
      direction: 'inbound',
      status: 'delivered',
      timestamp: Math.floor(timestamp / 1000),
    });

    // Update contact's last message time
    await db
      .update(contacts)
      .set({
        lastMessageAt: new Date(),
      })
      .where((c) => c.id === contact.id);

    // If message is media, download and cache it
    if (messageContent.id && ['image', 'video', 'audio', 'document'].includes(messageType)) {
      try {
        const mediaUrl = await metaApi.getMediaUrl(messageContent.id);
        // TODO: Cache media or save to storage
      } catch (error) {
        console.error('Error processing media:', error);
      }
    }

    // Auto-reply if enabled (simple example)
    await handleAutoReply(fromPhoneNumber, messageType, messageContent);
  }
}

/**
 * Handle message status changes
 */
async function handleMessageStatusChange(change: MetaWebhookChange): Promise<void> {
  const value = change.value;
  const statuses = value.statuses;

  if (!statuses || !statuses.length) return;

  for (const status of statuses) {
    // Update message status in database
    await db
      .update(messages)
      .set({
        status: status.status,
        updatedAt: new Date(),
      })
      .where((m) => m.id === status.id);

    // Handle errors if any
    if (status.errors && status.errors.length > 0) {
      const errorMessage = status.errors.map((e) => `${e.title}`).join(', ');
      await db
        .update(messages)
        .set({
          errorMessage,
          status: 'failed',
        })
        .where((m) => m.id === status.id);
    }
  }
}

/**
 * Simple auto-reply logic
 */
async function handleAutoReply(
  phoneNumber: string,
  messageType: string,
  messageContent: Record<string, any>
): Promise<void> {
  // Example: Auto-reply outside business hours
  const hour = new Date().getHours();
  const isOutsideBusinessHours = hour < 9 || hour > 18;

  if (isOutsideBusinessHours && messageType === 'text') {
    try {
      await metaApi.sendTextMessage(
        phoneNumber,
        'Thank you for your message. We are currently offline. We will get back to you during business hours (9 AM - 6 PM).'
      );
    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  }
}
