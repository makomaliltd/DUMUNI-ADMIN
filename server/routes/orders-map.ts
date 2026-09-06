// Helper de correspondance entre le schéma réel (place de marché DUMUNI) et la
// vue attendue par le panneau admin. Les commandes réelles vivent dans `orders`
// (buyer_id, restaurant_id, delivery_driver_id, subtotal, delivery_fee,
// commission, total...) alors que l'UI lit customer_name / restaurant_name /
// driver_name / amount / payment_status...
//
// On enrichit ici chaque ligne `orders` avec les colonnes affichées côté admin,
// en dérivant les valeurs depuis les vraies tables associées.
import { getSupabaseClient } from '../src/storage/database/supabase-client';

type AnyClient = ReturnType<typeof getSupabaseClient>;

// Dérive un statut de paiement cohérent avec le cycle de vie réel d'une commande
// (aucune colonne payment n'existe dans `orders`).
export function derivePaymentStatus(status?: string | null): string {
  if (!status) return 'pending';
  const done = ['delivered', 'completed', 'refunded'];
  if (done.includes(status)) return status === 'refunded' ? 'refunded' : 'paid';
  if (['cancelled', 'rejected', 'refused', 'failed'].includes(status)) return 'refunded';
  return 'pending';
}

// Enrichit une liste de lignes `orders` brutes avec les infos clients/restaurants/conducteurs.
export async function enrichOrders(
  supabase: AnyClient,
  rawOrders: any[]
): Promise<any[]> {
  if (!rawOrders || rawOrders.length === 0) return [];

  const orderIds = rawOrders.map((o) => o.id);
  const buyerIds = Array.from(new Set(rawOrders.map((o) => o.buyer_id).filter(Boolean)));
  const restaurantIds = Array.from(new Set(rawOrders.map((o) => o.restaurant_id).filter(Boolean)));
  const driverIds = Array.from(new Set(rawOrders.map((o) => o.delivery_driver_id).filter(Boolean)));

  // Clients (buyers)
  let users: any[] = [];
  if (buyerIds.length) {
    const { data } = await supabase.from('users').select('id,name,email,phone,avatar_url').in('id', buyerIds);
    users = data || [];
  }
  const userById = new Map(users.map((u) => [u.id, u]));

  // Restaurants
  let restaurants: any[] = [];
  if (restaurantIds.length) {
    const { data } = await supabase.from('restaurants').select('id,name').in('id', restaurantIds);
    restaurants = data || [];
  }
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  // Conducteurs affectés : users(role=driver) + driver_profiles
  let drivers: any[] = [];
  let driverProfiles: any[] = [];
  if (driverIds.length) {
    const dRes = await supabase.from('users').select('id,name,email,phone').in('id', driverIds);
    drivers = dRes.data || [];
    const pRes = await supabase.from('driver_profiles').select('*').in('user_id', driverIds);
    driverProfiles = pRes.data || [];
  }
  const driverById = new Map(drivers.map((d) => [d.id, d]));
  const profileByDriverId = new Map(driverProfiles.map((p) => [p.user_id, p]));

  return rawOrders.map((o: any) => {
    const buyer = userById.get(o.buyer_id);
    const restaurant = restaurantById.get(o.restaurant_id);
    const driver = driverById.get(o.delivery_driver_id);
    const profile = profileByDriverId.get(o.delivery_driver_id);

    return {
      ...o,
      // alias attendus par le front
      amount: o.total,
      customer_name: buyer?.name || '—',
      customer_phone: buyer?.phone || null,
      customer_email: buyer?.email || null,
      restaurant_name: restaurant?.name || null,
      driver_name: driver?.name || null,
      driver_phone: driver?.phone || null,
      driver_vehicle: profile?.vehicle_type || null,
      payment_status: derivePaymentStatus(o.status),
      buyer_id: o.buyer_id,
      delivery_driver_id: o.delivery_driver_id ?? null,
    };
  });
}
