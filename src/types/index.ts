// WhatsApp Message Types
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive' | 'location' | 'contacts';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  content: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  profilePicture: string | null;
  label: 'customer' | 'lead' | 'support' | 'other';
  lastMessageAt: Date;
  isBlocked: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  isApproved: boolean;
  language: string;
  metaTemplateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Meta Webhook Event Types
export interface MetaWebhookEvent {
  object: string;
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{ profile: { name: string }; wa_id: string }>;
    messages?: Array<{
      from: string;
      id: string;
      timestamp: string;
      type: string;
      text?: { body: string };
      image?: { id: string };
      video?: { id: string };
      audio?: { id: string };
      document?: { id: string; filename: string };
      location?: { latitude: number; longitude: number };
    }>;
    statuses?: Array<{
      id: string;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      timestamp: string;
      recipient_id: string;
      errors?: Array<{ code: number; title: string }>;
    }>;
  };
  field: string;
}

// Session Type
export interface SessionData {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: Date;
  expiresAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalContacts: number;
  totalMessages: number;
  unreadMessages: number;
  templateCount: number;
  lastUpdated: Date;
}
