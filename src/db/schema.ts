import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  json,
  varchar,
  serial,
  index,
} from 'drizzle-orm/pg-core';

// Messages Table
export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    contactId: text('contact_id').notNull(),
    messageType: varchar('message_type', { length: 50 }).notNull(),
    content: json('content').notNull(),
    direction: varchar('direction', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    timestamp: integer('timestamp').notNull(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    contactIdIdx: index('messages_contact_id_idx').on(table.contactId),
    timestampIdx: index('messages_timestamp_idx').on(table.timestamp),
    statusIdx: index('messages_status_idx').on(table.status),
  })
);

// Contacts Table
export const contacts = pgTable(
  'contacts',
  {
    id: text('id').primaryKey(),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
    displayName: text('display_name'),
    profilePictureUrl: text('profile_picture_url'),
    label: varchar('label', { length: 50 }).notNull().default('other'),
    lastMessageAt: timestamp('last_message_at'),
    isBlocked: boolean('is_blocked').notNull().default(false),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    phoneNumberIdx: index('contacts_phone_number_idx').on(table.phoneNumber),
    labelIdx: index('contacts_label_idx').on(table.label),
  })
);

// WhatsApp Templates Table
export const templates = pgTable(
  'templates',
  {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    content: text('content').notNull(),
    variables: json('variables').notNull(),
    isApproved: boolean('is_approved').notNull().default(false),
    language: varchar('language', { length: 10 }).notNull().default('en'),
    metaTemplateId: text('meta_template_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('templates_name_idx').on(table.name),
    approvedIdx: index('templates_is_approved_idx').on(table.isApproved),
  })
);

// Canned Responses Table
export const cannedResponses = pgTable(
  'canned_responses',
  {
    id: text('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    shortcut: varchar('shortcut', { length: 100 }).notNull().unique(),
    category: varchar('category', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    shortcutIdx: index('canned_responses_shortcut_idx').on(table.shortcut),
    categoryIdx: index('canned_responses_category_idx').on(table.category),
  })
);

// Message Media Cache Table
export const mediaCache = pgTable(
  'media_cache',
  {
    id: text('id').primaryKey(),
    mediaId: text('media_id').notNull(),
    mediaType: varchar('media_type', { length: 50 }).notNull(),
    localUrl: text('local_url').notNull(),
    metaUrl: text('meta_url'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    mediaIdIdx: index('media_cache_media_id_idx').on(table.mediaId),
    expiresAtIdx: index('media_cache_expires_at_idx').on(table.expiresAt),
  })
);

// Admin Sessions Table
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

// Activity Logs Table
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: text('resource_id').notNull(),
    changes: json('changes'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('activity_logs_user_id_idx').on(table.userId),
    createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
  })
);
