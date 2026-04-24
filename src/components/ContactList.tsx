"use client";

import React, { useState, useEffect } from "react";
import type { WhatsAppContact } from "@/types";

interface ContactListProps {
  sessionToken: string;
  onSelectContact: (contact: WhatsAppContact) => void;
}

export default function ContactList({
  sessionToken,
  onSelectContact,
}: ContactListProps) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchContacts = async (searchTerm = "", showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "50");
      params.append("offset", "0");
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/contacts?${params}`, {
        headers: {
          "x-session-token": sessionToken,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch contacts");

      const data = await response.json();
      setContacts(data.data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(search, true);

    // Polling every 5 seconds to update latest messages/read status
    const interval = setInterval(() => {
      fetchContacts(search, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <input
          type="text"
          placeholder="🔍 Search contacts..."
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No contacts found</p>
          </div>
        ) : (
          <div>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="w-full px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition text-left"
              >
                <div className="flex items-center gap-3">
                  {contact.profilePictureUrl ? (
                    <img
                      src={contact.profilePictureUrl}
                      alt={contact.displayName || contact.phoneNumber}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {(contact.displayName ||
                          contact.phoneNumber)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {contact.displayName || contact.phoneNumber}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {contact.phoneNumber}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
