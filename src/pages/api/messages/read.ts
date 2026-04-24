import type { APIRoute } from "astro";
import { db } from "@/db/client";
import { messages } from "@/db/schema";
import { validateSessionToken } from "@/lib/auth";
import { metaApi } from "@/lib/meta-api";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/messages/read
 * Mark messages from a contact as read
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-session-token");
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await validateSessionToken(token);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return new Response(
        JSON.stringify({ success: false, error: "Contact ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Find all unread inbound messages for this contact
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.contactId, contactId),
        eq(messages.direction, "inbound"),
        eq(messages.status, "delivered"), // Assuming delivered means not read yet
      ),
    });

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m) => m.id);

      // Notify Meta API for each message
      // We process them asynchronously to not block the response
      Promise.all(messageIds.map((id) => metaApi.markAsRead(id))).catch(
        console.error,
      );

      // Update database
      await db
        .update(messages)
        .set({ status: "read" })
        .where(inArray(messages.id, messageIds));
    }

    return new Response(
      JSON.stringify({ success: true, count: unreadMessages.length }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to mark messages as read",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
