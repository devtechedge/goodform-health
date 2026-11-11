import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export interface LearnReferenceLink {
  title: string;
  publisher: string;
  url: string;
}

export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey(), // 'default'
  freeShippingThresholdPaise: integer("free_shipping_threshold_paise")
    .notNull()
    .default(99900),
  standardShippingPaise: integer("standard_shipping_paise")
    .notNull()
    .default(7900),
  defaultGstRateBps: integer("default_gst_rate_bps").notNull().default(1800),
  dispatchStateCode: text("dispatch_state_code").notNull().default("MH"),
  announcementBarText: text("announcement_bar_text")
    .notNull()
    .default(
      "Free pan-India shipping from INR 999 · Full elemental dosing printed on every jar",
    ),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const learnArticles = pgTable(
  "learn_articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    readingMinutes: integer("reading_minutes").notNull().default(4),
    summary: text("summary").notNull(),
    sectionsJson: jsonb("sections_json")
      .$type<Array<{ heading: string; paragraphs: string[] }>>()
      .notNull(),
    referencesJson: jsonb("references_json")
      .$type<LearnReferenceLink[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_learn_sort_order").on(t.sortOrder)],
);

export const faqs = pgTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
  },
  (t) => [index("idx_faqs_sort_order").on(t.sortOrder)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  consentAccepted: boolean("consent_accepted").notNull(),
  consentTextSnapshot: text("consent_text_snapshot").notNull(),
  status: text("status")
    .$type<"ACTIVE" | "UNSUBSCRIBED">()
    .notNull()
    .default("ACTIVE"),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  orderNumber: text("order_number"),
  message: text("message").notNull(),
  status: text("status")
    .$type<"OPEN" | "RESOLVED">()
    .notNull()
    .default("OPEN"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: text("id").primaryKey(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    templateKey: text("template_key").notNull(),
    bodyText: text("body_text").notNull(),
    transportMode: text("transport_mode")
      .$type<"DEV_SINK" | "PROVIDER_SENT">()
      .notNull()
      .default("DEV_SINK"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_email_outbox_to").on(t.toEmail)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    summary: text("summary").notNull(),
    metadataJson: jsonb("metadata_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_audit_logs_created").on(t.createdAt)],
);
