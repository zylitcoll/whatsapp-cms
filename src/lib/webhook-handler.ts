import type { MetaWebhookEvent, MetaWebhookChange } from "@/types/index";
import { db } from "@/db/client";
import { messages, contacts } from "@/db/schema";
import { metaApi } from "./meta-api";
import crypto from "crypto";

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  verifyToken: string,
): boolean {
  const hash = crypto
    .createHmac("sha256", verifyToken)
    .update(body)
    .digest("hex");

  return `sha256=${hash}` === signature;
}

/**
 * Process incoming webhook events from Meta
 */
export async function processWebhookEvent(
  event: MetaWebhookEvent,
): Promise<void> {
  try {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages") {
          await handleMessageChange(change);
        } else if (change.field === "message_status") {
          await handleMessageStatusChange(change);
        } else if (change.field === "history") {
          await handleHistoryChange(change);
        }
      }
    }
  } catch (error) {
    console.error("Error processing webhook event:", error);
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
        contacts_data?.find((c) => c.wa_id === fromPhoneNumber)?.profile
          ?.name || "Unknown";

      const newContact = await db
        .insert(contacts)
        .values({
          id: crypto.randomUUID(),
          phoneNumber: fromPhoneNumber,
          displayName: contactName,
          label: "other",
        })
        .returning();

      contact = newContact[0];
    }

    // Store message
    const messageContent: Record<string, any> = {};
    let messageType = "text";

    if (message.text) {
      messageType = "text";
      messageContent.body = message.text.body;
    } else if (message.image) {
      messageType = "image";
      messageContent.id = message.image.id;
    } else if (message.video) {
      messageType = "video";
      messageContent.id = message.video.id;
    } else if (message.audio) {
      messageType = "audio";
      messageContent.id = message.audio.id;
    } else if (message.document) {
      messageType = "document";
      messageContent.id = message.document.id;
      messageContent.filename = message.document.filename;
    } else if (message.location) {
      messageType = "location";
      messageContent.latitude = message.location.latitude;
      messageContent.longitude = message.location.longitude;
    }

    // Store message in database
    await db.insert(messages).values({
      id: messageId,
      contactId: contact.id,
      messageType,
      content: messageContent,
      direction: "inbound",
      status: "delivered",
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
    if (
      messageContent.id &&
      ["image", "video", "audio", "document"].includes(messageType)
    ) {
      try {
        const mediaUrl = await metaApi.getMediaUrl(messageContent.id);
        // TODO: Cache media or save to storage
      } catch (error) {
        console.error("Error processing media:", error);
      }
    }

    // Auto-reply if enabled (simple example)
    await handleAutoReply(fromPhoneNumber, messageType, messageContent);
  }
}

/**
 * Handle message status changes
 */
async function handleMessageStatusChange(
  change: MetaWebhookChange,
): Promise<void> {
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
      const errorMessage = status.errors.map((e) => `${e.title}`).join(", ");
      await db
        .update(messages)
        .set({
          errorMessage,
          status: "failed",
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
  messageContent: Record<string, any>,
): Promise<void> {
  // === CONTOH 1: Balasan Otomatis Di Luar Jam Kerja ===
  const hour = new Date().getHours();
  const isOutsideBusinessHours = hour < 9 || hour > 18;

  if (isOutsideBusinessHours && messageType === "text") {
    try {
      // Hapus atau comment baris di bawah ini jika tidak ingin menggunakan auto-reply jam kerja
      // await metaApi.sendTextMessage(
      //   phoneNumber,
      //   "Terima kasih atas pesan Anda. Kami sedang offline saat ini dan akan membalas pesan Anda pada jam kerja (09:00 - 18:00).",
      // );
    } catch (error) {
      console.error("Error sending auto-reply:", error);
    }
  }

  // === CONTOH 2: Balasan Berdasarkan Keyword (Kata Kunci) ===
  if (messageType === "text" && messageContent.body) {
    const text = messageContent.body.toLowerCase();

    if (text === "ping" || text === "halo" || text === "hi") {
      try {
        await metaApi.sendTextMessage(
          phoneNumber,
          "Halo! Selamat datang di WhatsApp CMS kami. Ada yang bisa kami bantu? Ketik 'INFO' untuk melihat layanan kami.",
        );
      } catch (error) {}
    } else if (text === "info") {
      try {
        await metaApi.sendTextMessage(
          phoneNumber,
          "Layanan kami meliputi:\n1. Pembuatan Website\n2. Integrasi WhatsApp API\n3. Desain Grafis",
        );
      } catch (error) {}
    }
  }
}

/**
 * Handle message history sync
 */
async function handleHistoryChange(change: MetaWebhookChange): Promise<void> {
  const value = change.value;
  const historyData = value.history;

  if (!historyData || !historyData.length) return;

  for (const historyRecord of historyData) {
    const threads = historyRecord.threads;
    if (!threads || !threads.length) continue;

    for (const thread of threads) {
      const waId = thread.context?.wa_id;
      const username = thread.context?.username || "Unknown";
      const threadMessages = thread.messages;

      if (!waId || !threadMessages || !threadMessages.length) continue;

      // Ensure contact exists
      let contact = await db.query.contacts.findFirst({
        where: (contacts, { eq }) => eq(contacts.phoneNumber, waId),
      });

      if (!contact) {
        const newContact = await db
          .insert(contacts)
          .values({
            id: crypto.randomUUID(),
            phoneNumber: waId,
            displayName: username,
            label: "other",
          })
          .returning();

        contact = newContact[0];
      }

      for (const msg of threadMessages) {
        const messageId = msg.id;
        const timestamp = parseInt(msg.timestamp);

        // Check if message already exists (history might sync duplicates)
        const existingMessage = await db.query.messages.findFirst({
          where: (messages, { eq }) => eq(messages.id, messageId),
        });

        if (existingMessage) continue;

        const direction = msg.history_context?.from_me ? "outbound" : "inbound";
        const status = msg.history_context?.status || "delivered";

        const messageContent: Record<string, any> = {};
        let messageType = msg.type;

        // Parse content based on type
        if (msg.type === "text" && msg.text) {
          messageContent.body = msg.text.body;
        } else if (msg.type === "text" && msg.message?.text) {
          // Fallback if Meta uses different history payload structure
          messageContent.body = msg.message.text.body;
        } else if (["image", "video", "audio", "document"].includes(msg.type)) {
          // Historical media usually only provides ID
          const mediaField = msg[msg.type] || msg.message?.[msg.type];
          if (mediaField && mediaField.id) {
            messageContent.id = mediaField.id;
          }
        } else if (msg.type === "media_placeholder") {
          // Fallback for placeholder history
          messageType = "text";
          messageContent.body = "[Media Placeholder]";
        }

        // Insert historical message
        await db.insert(messages).values({
          id: messageId,
          contactId: contact.id,
          messageType,
          content: messageContent,
          direction,
          status,
          timestamp,
        });
      }
    }
  }
}
