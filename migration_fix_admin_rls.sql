-- ============================================================
-- fix_admin_rls_policies — DÉJÀ APPLIQUÉ sur Supabase
-- Ajout des RLS admin bypass pour toutes les tables
-- ============================================================

-- 1. withdrawal_requests: admin read/write
DROP POLICY IF EXISTS "Admin can view all withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "Admin can view all withdrawal_requests" ON public.withdrawal_requests
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

DROP POLICY IF EXISTS "Admin can manage all withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "Admin can manage all withdrawal_requests" ON public.withdrawal_requests
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 2. wallet_transactions: admin read
DROP POLICY IF EXISTS "Admin can view all wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Admin can view all wallet_transactions" ON public.wallet_transactions
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 3. delivery_locations: admin read
DROP POLICY IF EXISTS "Admin can view all delivery_locations" ON public.delivery_locations;
CREATE POLICY "Admin can view all delivery_locations" ON public.delivery_locations
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 4. notifications: admin read
DROP POLICY IF EXISTS "Admin can view all notifications" ON public.notifications;
CREATE POLICY "Admin can view all notifications" ON public.notifications
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 5. addresses: admin read
DROP POLICY IF EXISTS "Admin can view all addresses" ON public.addresses;
CREATE POLICY "Admin can view all addresses" ON public.addresses
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 6. favorites: admin read
DROP POLICY IF EXISTS "Admin can view all favorites" ON public.favorites;
CREATE POLICY "Admin can view all favorites" ON public.favorites
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 7. driver_profiles: admin ALL + drivers read/write own
DROP POLICY IF EXISTS "Admin can do anything on driver_profiles" ON public.driver_profiles;
CREATE POLICY "Admin can do anything on driver_profiles" ON public.driver_profiles
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

DROP POLICY IF EXISTS "Drivers can read own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can read own profile" ON public.driver_profiles
  FOR SELECT TO public
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can update own profile" ON public.driver_profiles
  FOR UPDATE TO public
  USING (user_id::text = auth.uid()::text);

-- 8. ads: admin manage + public read
DROP POLICY IF EXISTS "Admin can manage ads" ON public.ads;
CREATE POLICY "Admin can manage ads" ON public.ads
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

DROP POLICY IF EXISTS "Anyone can view ads" ON public.ads;
CREATE POLICY "Anyone can view ads" ON public.ads
  FOR SELECT TO public
  USING (true);

-- 9. promotions: admin manage + public read
DROP POLICY IF EXISTS "Admin can manage promotions" ON public.promotions;
CREATE POLICY "Admin can manage promotions" ON public.promotions
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

DROP POLICY IF EXISTS "Anyone can view promotions" ON public.promotions;
CREATE POLICY "Anyone can view promotions" ON public.promotions
  FOR SELECT TO public
  USING (true);

-- 10. admin_roles: admin read
DROP POLICY IF EXISTS "Admin can view admin_roles" ON public.admin_roles;
CREATE POLICY "Admin can view admin_roles" ON public.admin_roles
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid()::text AND u.role::text = 'admin'::text));

-- 11. health_check: public read
DROP POLICY IF EXISTS "Public read health_check" ON public.health_check;
CREATE POLICY "Public read health_check" ON public.health_check
  FOR SELECT TO public
  USING (true);
