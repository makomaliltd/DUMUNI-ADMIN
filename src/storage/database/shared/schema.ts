import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  uuid,
  varchar,
  numeric,
  integer,
  timestamp,
  text,
  date,
  index,
  type PgTableWithColumns,
} from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ─── Restaurants ───────────────────────────────────────────────
export const restaurants = pgTable(
  "restaurants",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).references(() => profiles.id),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    logo_url: text("logo_url"),
    banner_url: text("banner_url"),
    address: varchar("address", { length: 500 }),
    phone: varchar("phone", { length: 20 }),
    hours: varchar("hours", { length: 200 }),
    cuisine_type: varchar("cuisine_type", { length: 50 }),
    delivery_fee: numeric("delivery_fee", { precision: 8, scale: 2 }).default("0"),
    min_order: numeric("min_order", { precision: 8, scale: 2 }).default("0"),
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
    review_count: integer("review_count").default(0),
    is_open: varchar("is_open", { length: 10 }).default("true").notNull(),
    verified: varchar("verified", { length: 20 }).default("pending").notNull(),
    total_orders: integer("total_orders").default(0).notNull(),
    total_revenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("restaurants_status_idx").on(table.status),
    index("restaurants_total_orders_idx").on(table.total_orders),
    index("restaurants_cuisine_type_idx").on(table.cuisine_type),
    index("restaurants_verified_idx").on(table.verified),
  ],
);

// ─── Menu Items ────────────────────────────────────────────────
export const menuItems = pgTable(
  "menu_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    restaurant_id: varchar("restaurant_id", { length: 36 }).notNull().references(() => restaurants.id),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 50 }),
    image_url: text("image_url"),
    is_available: varchar("is_available", { length: 10 }).default("true").notNull(),
    is_popular: varchar("is_popular", { length: 10 }).default("false").notNull(),
    sort_order: integer("sort_order").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("menu_items_restaurant_id_idx").on(table.restaurant_id),
    index("menu_items_category_idx").on(table.category),
  ],
);

// ─── Seller Applications ───────────────────────────────────────
export const sellerApplications = pgTable(
  "seller_applications",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).references(() => profiles.id),
    owner_name: varchar("owner_name", { length: 200 }).notNull(),
    owner_email: varchar("owner_email", { length: 255 }).notNull(),
    owner_phone: varchar("owner_phone", { length: 20 }),
    restaurant_name: varchar("restaurant_name", { length: 200 }).notNull(),
    cuisine_type: varchar("cuisine_type", { length: 50 }),
    address: varchar("address", { length: 500 }),
    license_url: text("license_url"),
    id_url: text("id_url"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    notes: text("notes"),
    reviewed_by: varchar("reviewed_by", { length: 36 }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("seller_applications_status_idx").on(table.status),
    index("seller_applications_created_at_idx").on(table.created_at),
  ],
);

// ─── Orders ────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    restaurant_id: varchar("restaurant_id", { length: 36 }).notNull().references(() => restaurants.id),
    user_id: varchar("user_id", { length: 36 }).references(() => profiles.id),
    driver_id: varchar("driver_id", { length: 36 }).references(() => drivers.id),
    customer_name: varchar("customer_name", { length: 100 }).notNull(),
    customer_phone: varchar("customer_phone", { length: 20 }),
    customer_email: varchar("customer_email", { length: 255 }),
    delivery_address: text("delivery_address"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
    delivery_fee: numeric("delivery_fee", { precision: 8, scale: 2 }).default("0").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    commission: numeric("commission", { precision: 10, scale: 2 }).default("0").notNull(),
    payment_status: varchar("payment_status", { length: 20 }).default("pending").notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    cancel_reason: text("cancel_reason"),
    items_count: integer("items_count").default(1).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_restaurant_id_idx").on(table.restaurant_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
    index("orders_status_created_idx").on(table.status, table.created_at),
    index("orders_driver_id_idx").on(table.driver_id),
    index("orders_payment_status_idx").on(table.payment_status),
  ],
);

// ─── Order Items ────────────────────────────────────────────────
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
    name: varchar("name", { length: 200 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.order_id),
  ],
);

// ─── Order Status Logs ──────────────────────────────────────────
export const orderStatusLogs = pgTable(
  "order_status_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
    from_status: varchar("from_status", { length: 20 }),
    to_status: varchar("to_status", { length: 20 }).notNull(),
    changed_by: varchar("changed_by", { length: 36 }),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("order_status_logs_order_id_idx").on(table.order_id),
    index("order_status_logs_created_at_idx").on(table.created_at),
  ],
);

// ─── Revenue Records ───────────────────────────────────────────
export const revenueRecords = pgTable(
  "revenue_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    date: date("date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    commission: numeric("commission", { precision: 12, scale: 2 }).notNull(),
    order_count: integer("order_count").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("revenue_records_date_idx").on(table.date),
  ],
);

// ─── Reviews ───────────────────────────────────────────────────
export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    restaurant_id: varchar("restaurant_id", { length: 36 }).notNull().references(() => restaurants.id),
    customer_name: varchar("customer_name", { length: 100 }).notNull(),
    rating: integer("rating").notNull(),
    content: text("content"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reviews_restaurant_id_idx").on(table.restaurant_id),
    index("reviews_status_idx").on(table.status),
    index("reviews_created_at_idx").on(table.created_at),
  ],
);

// ─── Content Management ────────────────────────────────────────
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image_url: text("image_url"),
  link_url: text("link_url"),
  discount_text: varchar("discount_text", { length: 200 }),
  restaurant_id: uuid("restaurant_id").references(() => restaurants.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("active"),
  sort_order: integer("sort_order").default(0),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const promo_codes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discount_type: varchar("discount_type", { length: 20 }).notNull().default("percentage"),
  discount_value: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  min_order_amount: numeric("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  max_discount: numeric("max_discount", { precision: 10, scale: 2 }),
  usage_limit: integer("usage_limit").default(0),
  usage_count: integer("usage_count").default(0),
  status: varchar("status", { length: 20 }).default("active"),
  start_date: timestamp("start_date").defaultNow(),
  expiry_date: timestamp("expiry_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  sort_order: integer("sort_order").default(0),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("system"),
  recipient_type: varchar("recipient_type", { length: 50 }).default("all"),
  recipient_id: uuid("recipient_id"),
  sent_count: integer("sent_count").default(0),
  read_count: integer("read_count").default(0),
  status: varchar("status", { length: 20 }).default("sent"),
  created_at: timestamp("created_at").defaultNow(),
  sent_at: timestamp("sent_at"),
});

export const notification_templates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("system"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

export const email_settings = pgTable("email_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: varchar("description", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at"),
});

// ─── Profiles (User Management) ─────────────────────────────────
export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 200 }),
    phone: varchar("phone", { length: 20 }),
    avatar_url: text("avatar_url"),
    role: varchar("role", { length: 20 }).default("viewer").notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_email_idx").on(table.email),
    index("profiles_role_idx").on(table.role),
    index("profiles_status_idx").on(table.status),
    index("profiles_created_at_idx").on(table.created_at),
  ],
);

// ─── Delivery Records ──────────────────────────────────────────
export const deliveryRecords = pgTable(
  "delivery_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => profiles.id),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
    status: varchar("status", { length: 20 }).default("assigned").notNull(),
    distance: numeric("distance", { precision: 8, scale: 2 }).default("0"),
    delivery_fee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("delivery_records_user_id_idx").on(table.user_id),
    index("delivery_records_status_idx").on(table.status),
  ],
);

// ─── Transactions ──────────────────────────────────────────────
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => profiles.id),
    type: varchar("type", { length: 30 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    balance_before: numeric("balance_before", { precision: 12, scale: 2 }).default("0"),
    balance_after: numeric("balance_after", { precision: 12, scale: 2 }).default("0"),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("completed").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.user_id),
    index("transactions_created_at_idx").on(table.created_at),
    index("transactions_type_idx").on(table.type),
  ],
);

// ─── Withdrawals ───────────────────────────────────────────────
export const withdrawals = pgTable(
  "withdrawals",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).references(() => profiles.id),
    user_name: varchar("user_name", { length: 100 }).notNull(),
    user_type: varchar("user_type", { length: 20 }).default("seller").notNull(),
    phone_number: varchar("phone_number", { length: 20 }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    notes: text("notes"),
    reject_reason: text("reject_reason"),
    reviewed_by: varchar("reviewed_by", { length: 36 }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("withdrawals_user_id_idx").on(table.user_id),
    index("withdrawals_status_idx").on(table.status),
    index("withdrawals_created_at_idx").on(table.created_at),
    index("withdrawals_user_type_idx").on(table.user_type),
  ],
);

// ─── Financial Settings ───────────────────────────────────────
export const financialSettings = pgTable(
  "financial_settings",
  {
    id: serial().notNull(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("financial_settings_key_idx").on(table.key),
  ],
);

// ─── Audit Logs ───────────────────────────────────────────────
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    action: varchar("action", { length: 50 }).notNull(),
    entity_type: varchar("entity_type", { length: 50 }).notNull(),
    entity_id: varchar("entity_id", { length: 36 }),
    performed_by: varchar("performed_by", { length: 36 }),
    details: text("details"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_type_idx").on(table.entity_type),
    index("audit_logs_created_at_idx").on(table.created_at),
  ],
);

// ─── Drivers ────────────────────────────────────────────────────
export const drivers = pgTable(
  "drivers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => profiles.id),
    full_name: varchar("full_name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }),
    vehicle_type: varchar("vehicle_type", { length: 50 }).default("电动车"),
    vehicle_plate: varchar("vehicle_plate", { length: 20 }),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    is_available: varchar("is_available", { length: 10 }).default("true").notNull(),
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
    total_deliveries: integer("total_deliveries").default(0).notNull(),
    completed_deliveries: integer("completed_deliveries").default(0).notNull(),
    total_earnings: numeric("total_earnings", { precision: 12, scale: 2 }).default("0").notNull(),
    license_url: text("license_url"),
    id_url: text("id_url"),
    current_lat: numeric("current_lat", { precision: 10, scale: 7 }),
    current_lng: numeric("current_lng", { precision: 10, scale: 7 }),
    last_location_update: timestamp("last_location_update", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("drivers_user_id_idx").on(table.user_id),
    index("drivers_status_idx").on(table.status),
    index("drivers_available_idx").on(table.is_available),
    index("drivers_vehicle_type_idx").on(table.vehicle_type),
  ],
);

// ─── Driver Applications ────────────────────────────────────────
export const driverApplications = pgTable(
  "driver_applications",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).references(() => profiles.id),
    full_name: varchar("full_name", { length: 200 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    vehicle_type: varchar("vehicle_type", { length: 50 }).default("电动车"),
    vehicle_plate: varchar("vehicle_plate", { length: 20 }),
    license_url: text("license_url"),
    id_url: text("id_url"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    notes: text("notes"),
    reviewed_by: varchar("reviewed_by", { length: 36 }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("driver_applications_status_idx").on(table.status),
    index("driver_applications_created_at_idx").on(table.created_at),
  ],
);