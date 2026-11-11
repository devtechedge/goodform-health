CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"pack_label" text NOT NULL,
	"servings_count" integer NOT NULL,
	"price_paise" integer NOT NULL,
	"gst_rate_bps" integer DEFAULT 1800 NOT NULL,
	"weight_grams" integer DEFAULT 180 NOT NULL,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"stock_reserved" integer DEFAULT 0 NOT NULL,
	"batch_number" text NOT NULL,
	"manufactured_date" text NOT NULL,
	"expiry_date" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "chk_variants_price_nonneg" CHECK ("product_variants"."price_paise" >= 0),
	CONSTRAINT "chk_variants_stock_nonneg" CHECK ("product_variants"."stock_on_hand" >= 0),
	CONSTRAINT "chk_variants_reserved_nonneg" CHECK ("product_variants"."stock_reserved" >= 0),
	CONSTRAINT "chk_variants_servings_pos" CHECK ("product_variants"."servings_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"subtitle" text NOT NULL,
	"short_summary" text NOT NULL,
	"editorial_description" text NOT NULL,
	"primary_collection" text NOT NULL,
	"collection_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supplement_form" text NOT NULL,
	"serving_size_label" text NOT NULL,
	"servings_per_pack" integer NOT NULL,
	"net_quantity_label" text NOT NULL,
	"ingredients_json" jsonb NOT NULL,
	"other_ingredients" text NOT NULL,
	"diet_type" text NOT NULL,
	"allergen_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"label_summary" text NOT NULL,
	"directions_for_use" text NOT NULL,
	"warnings_json" jsonb NOT NULL,
	"storage_instructions" text NOT NULL,
	"image_path" text NOT NULL,
	"macro_image_path" text,
	"is_flagship" boolean DEFAULT false NOT NULL,
	"featured_rank" integer,
	"market_signal_badge" text,
	"market_signal_source_url" text,
	"routine_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fssai_category" text NOT NULL,
	"ingredient_eligibility_state" text NOT NULL,
	"compliance_review_state" text NOT NULL,
	"publish_status" text DEFAULT 'UNPUBLISHED_HOLD' NOT NULL,
	"hold_reason" text,
	"jurisdiction" text DEFAULT 'IN' NOT NULL,
	"fbo_license_number" text,
	"fbo_license_verified" boolean DEFAULT false NOT NULL,
	"manufacturer_name" text NOT NULL,
	"importer_details" text,
	"country_of_origin" text DEFAULT 'India' NOT NULL,
	"owner_evidence_json" jsonb NOT NULL,
	"is_demo_seed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "chk_products_servings_pos" CHECK ("products"."servings_per_pack" > 0)
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"recipient_name" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"landmark" text,
	"city" text NOT NULL,
	"state_code" text NOT NULL,
	"pin_code" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_routines" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"preferences_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"product_slugs_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'CUSTOMER' NOT NULL,
	"phone" text,
	"is_demo_account" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cart_items_qty_pos" CHECK ("cart_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"guest_token_hash" text,
	"applied_coupon_code" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "carts_guest_token_hash_unique" UNIQUE("guest_token_hash")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"min_subtotal_paise" integer DEFAULT 0 NOT NULL,
	"max_discount_paise" integer,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"sku" text NOT NULL,
	"product_slug" text NOT NULL,
	"product_name" text NOT NULL,
	"variant_title" text NOT NULL,
	"batch_number" text NOT NULL,
	"expiry_date" text NOT NULL,
	"ingredient_snapshot" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"gst_rate_bps" integer NOT NULL,
	"line_total_paise" integer NOT NULL,
	CONSTRAINT "chk_order_items_qty_pos" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" text,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"order_status" text NOT NULL,
	"payment_provider" text NOT NULL,
	"payment_status" text NOT NULL,
	"provider_order_id" text,
	"provider_payment_id" text,
	"coupon_code" text,
	"subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"shipping_paise" integer DEFAULT 0 NOT NULL,
	"taxable_paise" integer NOT NULL,
	"cgst_paise" integer DEFAULT 0 NOT NULL,
	"sgst_paise" integer DEFAULT 0 NOT NULL,
	"igst_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"shipping_address_json" jsonb NOT NULL,
	"is_demo_order" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "chk_orders_total_nonneg" CHECK ("orders"."total_paise" >= 0),
	CONSTRAINT "chk_orders_subtotal_nonneg" CHECK ("orders"."subtotal_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"order_id" text,
	"payload_sha256" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"refund_paise" integer DEFAULT 0 NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"summary" text NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"order_number" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"template_key" text NOT NULL,
	"body_text" text NOT NULL,
	"transport_mode" text DEFAULT 'DEV_SINK' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learn_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"reading_minutes" integer DEFAULT 4 NOT NULL,
	"summary" text NOT NULL,
	"sections_json" jsonb NOT NULL,
	"references_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learn_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"consent_accepted" boolean NOT NULL,
	"consent_text_snapshot" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"free_shipping_threshold_paise" integer DEFAULT 99900 NOT NULL,
	"standard_shipping_paise" integer DEFAULT 7900 NOT NULL,
	"default_gst_rate_bps" integer DEFAULT 1800 NOT NULL,
	"dispatch_state_code" text DEFAULT 'MH' NOT NULL,
	"announcement_bar_text" text DEFAULT 'Free pan-India shipping from INR 999 · Full elemental dosing printed on every jar' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_routines" ADD CONSTRAINT "saved_routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_variants_product_id" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_products_primary_collection" ON "products" USING btree ("primary_collection");--> statement-breakpoint
CREATE INDEX "idx_products_publish_status" ON "products" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "idx_products_featured_rank" ON "products" USING btree ("featured_rank");--> statement-breakpoint
CREATE INDEX "idx_addresses_user_id" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_routines_user_id" ON "saved_routines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_cart_items_cart_variant" ON "cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "idx_carts_guest_token" ON "carts" USING btree ("guest_token_hash");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_webhook_provider_event" ON "payment_webhook_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_returns_order_id" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx_wishlist_user_product" ON "wishlist_items" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_email_outbox_to" ON "email_outbox" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "idx_faqs_sort_order" ON "faqs" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_learn_sort_order" ON "learn_articles" USING btree ("sort_order");