-- ============================================================
-- DUMUNI Admin Dashboard - Migration SQL
-- Execute this entire script in your Supabase SQL Editor
--
-- NOTE: The orders and restaurants tables already exist in this
-- project (from a prior "Food Delivery Platform Schema & RLS"
-- migration). This script uses ALTER TABLE ADD COLUMN IF NOT EXISTS
-- to add missing columns the admin dashboard expects, and CREATE
-- TABLE IF NOT EXISTS for all other tables.
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'viewer' NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- 2. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  vehicle_type VARCHAR(50) DEFAULT '电动车',
  vehicle_plate VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  is_available VARCHAR(10) DEFAULT 'true' NOT NULL,
  rating NUMERIC(3,2) DEFAULT '0',
  total_deliveries INTEGER DEFAULT 0 NOT NULL,
  completed_deliveries INTEGER DEFAULT 0 NOT NULL,
  total_earnings NUMERIC(12,2) DEFAULT '0' NOT NULL,
  license_url TEXT,
  id_url TEXT,
  current_lat NUMERIC(10,7),
  current_lng NUMERIC(10,7),
  last_location_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS drivers_user_id_idx ON drivers(user_id);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON drivers(status);
CREATE INDEX IF NOT EXISTS drivers_available_idx ON drivers(is_available);

-- 3. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  restaurant_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  image_url TEXT,
  is_available VARCHAR(10) DEFAULT 'true' NOT NULL,
  is_popular VARCHAR(10) DEFAULT 'false' NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS menu_items_restaurant_id_idx ON menu_items(restaurant_id);

-- 4. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- 5. ORDER STATUS LOGS
CREATE TABLE IF NOT EXISTS order_status_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id VARCHAR(36) NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(36),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS order_status_logs_order_id_idx ON order_status_logs(order_id);

-- 6. REVENUE RECORDS
CREATE TABLE IF NOT EXISTS revenue_records (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  commission NUMERIC(12,2) NOT NULL,
  order_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS revenue_records_date_idx ON revenue_records(date);

-- 7. BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  discount_text VARCHAR(200),
  restaurant_id VARCHAR(36),
  status VARCHAR(20) DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 8. PROMO CODES
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT '0',
  max_discount NUMERIC(10,2),
  usage_limit INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 9. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 10. NOTIFICATION TEMPLATES
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 11. EMAIL SETTINGS
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- 12. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 13. SCHEDULED REPORTS
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  recipients JSONB DEFAULT '[]',
  format VARCHAR(20) DEFAULT 'pdf',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 14. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR(36),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. FINANCIAL SETTINGS
CREATE TABLE IF NOT EXISTS financial_settings (
  id SERIAL NOT NULL,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. SELLER APPLICATIONS
CREATE TABLE IF NOT EXISTS seller_applications (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36),
  owner_name VARCHAR(200) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  restaurant_name VARCHAR(200) NOT NULL,
  cuisine_type VARCHAR(50),
  address VARCHAR(500),
  license_url TEXT,
  id_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  notes TEXT,
  reviewed_by VARCHAR(36),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 17. DRIVER APPLICATIONS
CREATE TABLE IF NOT EXISTS driver_applications (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36),
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  vehicle_type VARCHAR(50) DEFAULT '电动车',
  vehicle_plate VARCHAR(20),
  license_url TEXT,
  id_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  notes TEXT,
  reviewed_by VARCHAR(36),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 18. WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36),
  user_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) DEFAULT 'seller' NOT NULL,
  phone_number VARCHAR(20),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  notes TEXT,
  reject_reason TEXT,
  reviewed_by VARCHAR(36),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 19. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(30) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) DEFAULT '0',
  balance_after NUMERIC(12,2) DEFAULT '0',
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 20. DELIVERY RECORDS
CREATE TABLE IF NOT EXISTS delivery_records (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'assigned' NOT NULL,
  distance NUMERIC(8,2) DEFAULT '0',
  delivery_fee NUMERIC(10,2) DEFAULT '0',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 21. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36),
  performed_by VARCHAR(36),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 22. HEALTH CHECK
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) NOT NULL,
  role_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 24. RESTAURANTS
CREATE TABLE IF NOT EXISTS restaurants (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_name VARCHAR(200) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cuisine_type VARCHAR(50),
  address VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  is_open VARCHAR(10) DEFAULT 'true' NOT NULL,
  rating NUMERIC(3,2) DEFAULT '0',
  total_orders INTEGER DEFAULT 0 NOT NULL,
  total_revenue NUMERIC(12,2) DEFAULT '0' NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT '10',
  license_url TEXT,
  id_url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  delivery_radius_km NUMERIC(5,2) DEFAULT '5',
  average_delivery_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS restaurants_status_idx ON restaurants(status);
CREATE INDEX IF NOT EXISTS restaurants_cuisine_idx ON restaurants(cuisine_type);

-- 25. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id VARCHAR(36),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  restaurant_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  payment_method VARCHAR(20),
  amount NUMERIC(12,2) DEFAULT '0' NOT NULL,
  commission NUMERIC(12,2) DEFAULT '0' NOT NULL,
  subtotal NUMERIC(12,2) DEFAULT '0' NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT '0' NOT NULL,
  discount NUMERIC(10,2) DEFAULT '0',
  tax NUMERIC(10,2) DEFAULT '0',
  total_amount NUMERIC(12,2) DEFAULT '0' NOT NULL,
  delivery_address VARCHAR(500),
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS orders_restaurant_idx ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS orders_driver_idx ON orders(driver_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);

-- 26. ADMIN ROLES
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- 27. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'system',
  read BOOLEAN DEFAULT false,
  user_id VARCHAR(36),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);

-- 29. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36),
  restaurant_id VARCHAR(36),
  order_id VARCHAR(36),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS reviews_restaurant_idx ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews(user_id);

-- ============================================================
-- INSERT ADMIN ROLES (if missing)
-- ============================================================
INSERT INTO admin_roles (name, role_name, permissions) VALUES
('Super Admin', 'super_admin', '{"users":{"create":true,"read":true,"update":true,"delete":true},"orders":{"create":true,"read":true,"update":true,"delete":true},"restaurants":{"create":true,"read":true,"update":true,"delete":true},"drivers":{"create":true,"read":true,"update":true,"delete":true},"financial":{"read":true,"approve_withdrawals":true},"settings":{"read":true,"update":true},"notifications":{"create":true,"read":true}}'),
('Manager', 'manager', '{"users":{"create":true,"read":true,"update":true,"delete":false},"orders":{"create":true,"read":true,"update":true,"delete":false},"restaurants":{"create":true,"read":true,"update":true,"delete":false},"drivers":{"create":true,"read":true,"update":true,"delete":false},"financial":{"read":true,"approve_withdrawals":false},"settings":{"read":true,"update":false},"notifications":{"create":true,"read":true}}'),
('Support', 'support', '{"users":{"create":false,"read":true,"update":true,"delete":false},"orders":{"create":false,"read":true,"update":true,"delete":false},"restaurants":{"create":false,"read":true,"update":false,"delete":false},"drivers":{"create":false,"read":true,"update":false,"delete":false},"financial":{"read":false,"approve_withdrawals":false},"settings":{"read":false,"update":false},"notifications":{"create":false,"read":true}}'),
('Finance', 'finance', '{"users":{"create":false,"read":true,"update":false,"delete":false},"orders":{"create":false,"read":true,"update":false,"delete":false},"restaurants":{"create":false,"read":true,"update":false,"delete":false},"drivers":{"create":false,"read":true,"update":false,"delete":false},"financial":{"read":true,"approve_withdrawals":true},"settings":{"read":true,"update":false},"notifications":{"create":false,"read":true}}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INSERT ADMIN USERS
-- ============================================================
-- Replace the user_id values with actual UUIDs from your auth.users table
-- INSERT INTO admin_users (user_id, role_id, is_active)
-- VALUES ('<REPLACE_WITH_ADMIN_USER_UUID>', (SELECT id FROM admin_roles WHERE name = 'Super Admin'), true);

-- ============================================================
-- INSERT PLATFORM SETTINGS
-- ============================================================
INSERT INTO platform_settings (key, value, description) VALUES
('platform_name', 'DUMUNI', 'Nom de la plateforme'),
('platform_currency', 'FCFA', 'Devise par défaut'),
('base_delivery_fee', '1000', 'Frais de livraison de base'),
('per_km_delivery_fee', '500', 'Frais de livraison par km'),
('max_delivery_distance', '15', 'Distance de livraison maximale (km)'),
('min_delivery_time', '30', 'Temps de livraison minimum (min)'),
('max_delivery_time', '60', 'Temps de livraison maximum (min)'),
('commission_rate', '10', 'Taux de commission (%)'),
('min_order_amount', '2000', 'Montant minimum de commande'),
('tax_rate', '5.5', 'Taux de taxe (%)'),
('default_language', 'fr', 'Langue par défaut'),
('timezone', 'Africa/Douala', 'Fuseau horaire'),
('date_format', 'DD/MM/YYYY', 'Format de date'),
('maintenance_mode', 'false', 'Mode maintenance'),
('api_rate_limit', '100', 'Limite de requêtes API par minute')
ON CONFLICT (key) DO NOTHING;