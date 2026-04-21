'use client';

import React, { useState, useEffect } from 'react';
import type { CannedResponse } from '@/types';

interface CannedResponsesProps {
  sessionToken: string;
  onSelectResponse: (response: CannedResponse) => void;
}

export default function CannedResponses({ sessionToken, onSelectResponse }: CannedResponsesProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/canned-responses', {
        headers: {
          'x-session-token': sessionToken,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch responses');

      const data = await response.json();
      setResponses(data.data || []);
    } catch (error) {
      console.error('Error fetching canned responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shortcut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4">Quick Replies</h2>

      <input
        type="text"
        placeholder="Search... (Type ':' for shortcuts)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:border-green-500 outline-none mb-4"
      />

      {loading ? (
        <div className="text-center py-4 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>
      ) : filteredResponses.length === 0 ? (
        <p className="text-center py-4 text-gray-400 text-sm">No quick replies found</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredResponses.map((response) => (
            <button
              key={response.id}
              onClick={() => onSelectResponse(response)}
              className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm group-hover:text-green-400">
                    {response.title}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-1">{response.content}</p>
                </div>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded ml-2 whitespace-nowrap">
                  {response.shortcut}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
