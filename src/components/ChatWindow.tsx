"use client";

import React, { useState, useEffect, useRef } from "react";
import type { WhatsAppMessage, WhatsAppContact } from "@/types";

interface ChatWindowProps {
  contact: WhatsAppContact | null;
  sessionToken: string;
  onMessageSent?: () => void;
}

export default function ChatWindow({
  contact,
  sessionToken,
  onMessageSent,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const markMessagesAsRead = async () => {
    if (!contact) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ contactId: contact.id }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (!contact) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`/api/messages/${contact.id}?limit=50`, {
        headers: {
          "x-session-token": sessionToken,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      const fetchedMessages = data.data.messages || [];
      setMessages(fetchedMessages);

      // Check if there are any unread inbound messages
      const hasUnread = fetchedMessages.some(
        (m: WhatsAppMessage) =>
          m.direction === "inbound" && m.status !== "read",
      );
      if (hasUnread) {
        markMessagesAsRead();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (contact) {
      fetchMessages(true);

      // Real-time polling: Check for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [contact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !contact || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({
          recipientPhoneNumber: contact.phoneNumber,
          messageText: messageText.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      setMessageText("");
      await fetchMessages();
      onMessageSent?.();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <p>Select a contact to start chatting</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓";
      case "failed":
        return "✗";
      default:
        return "⏱";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center gap-3">
        {contact.profilePictureUrl ? (
          <img
            src={contact.profilePictureUrl}
            alt={contact.displayName || contact.phoneNumber}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-sm font-bold">
              {(contact.displayName || contact.phoneNumber)[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-white">
            {contact.displayName || contact.phoneNumber}
          </p>
          <p className="text-xs text-gray-400">{contact.phoneNumber}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.direction === "outbound"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <p className="break-words">
                  {msg.messageType === "text"
                    ? msg.content?.body || "[Empty Message]"
                    : `[${msg.messageType.toUpperCase()}]`}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    msg.direction === "outbound"
                      ? "text-green-200"
                      : "text-gray-500"
                  }`}
                >
                  {formatTime(msg.timestamp)}{" "}
                  {msg.direction === "outbound" && getStatusIcon(msg.status)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="bg-gray-800 border-t border-gray-700 p-4 flex gap-2"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !messageText.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
