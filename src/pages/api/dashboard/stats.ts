import type { APIRoute } from "astro";
import { db } from "@/db/client";
import { messages, contacts } from "@/db/schema";
import { validateSessionToken } from "@/lib/auth";
import { count, eq } from "drizzle-orm";

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export const GET: APIRoute = async ({ request }) => {
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

    // Get statistics
    const totalContacts = await db.select({ count: count() }).from(contacts);

    const totalMessages = await db.select({ count: count() }).from(messages);

    const unreadMessages = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.status, "delivered"));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalContacts: totalContacts[0]?.count || 0,
          totalMessages: totalMessages[0]?.count || 0,
          unreadMessages: unreadMessages[0]?.count || 0,
          lastUpdated: new Date(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch statistics",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
