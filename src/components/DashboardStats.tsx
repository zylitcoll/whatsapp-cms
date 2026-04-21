'use client';

import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '@/types';

interface DashboardStatsProps {
  sessionToken: string;
}

export default function DashboardStats({ sessionToken }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'x-session-token': sessionToken,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-lg p-4 h-20 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-red-500">Failed to load statistics</div>;
  }

  const StatCard = ({
    icon,
    title,
    value,
    color,
  }: {
    icon: string;
    title: string;
    value: number;
    color: string;
  }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`${color} text-white rounded-lg p-3 text-2xl`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        icon="👥"
        title="Total Contacts"
        value={stats.totalContacts}
        color="bg-blue-600"
      />
      <StatCard
        icon="💬"
        title="Messages"
        value={stats.totalMessages}
        color="bg-green-600"
      />
      <StatCard
        icon="📥"
        title="Unread Messages"
        value={stats.unreadMessages}
        color="bg-yellow-600"
      />
      <StatCard icon="📧" title="Templates" value={0} color="bg-purple-600" />
    </div>
  );
}
