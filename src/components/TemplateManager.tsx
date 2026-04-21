'use client';

import React, { useState, useEffect } from 'react';
import type { WhatsAppTemplate } from '@/types';

interface TemplateManagerProps {
  sessionToken: string;
  onSelectTemplate: (template: WhatsAppTemplate) => void;
}

export default function TemplateManager({ sessionToken, onSelectTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterApproved, setFilterApproved] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [filterApproved]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterApproved) params.append('approved', 'true');

      const response = await fetch(`/api/templates?${params}`, {
        headers: {
          'x-session-token': sessionToken,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Message Templates</h2>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filterApproved}
            onChange={(e) => setFilterApproved(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          Approved only
        </label>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <p className="text-center py-4 text-gray-400">No templates found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white group"
            >
              <p className="font-semibold text-sm group-hover:text-green-400">{template.name}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.content}</p>
              {template.variables.length > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Variables: {template.variables.length}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
