import { Router, Request, Response } from "express";
import { getSupabaseClient } from "../src/storage/database/supabase-client";

const router = Router();

// Les "conducteurs" = users(role='driver') + driver_profiles (optionnel).
// L'identifiant utilisé partout (affectation, orders.delivery_driver_id…) est
// celui de l'utilisateur, qu'on expose aussi comme `id` du conducteur.
type RawProfile = {
  id?: string;
  user_id?: string;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  license_url?: string | null;
  id_card_url?: string | null;
  mobile_money_number?: string | null;
  is_approved?: boolean;
  is_available?: boolean;
  current_latitude?: number | null;
  current_longitude?: number | null;
  completed_deliveries?: number | null;
  total_earned?: number | null;
  total_withdrawn?: number | null;
  created_at?: string;
};

async function buildDriver(user: any, profile: RawProfile | null): Promise<any> {
  const approved = !!profile?.is_approved;
  return {
    id: user.id, // id utilisateur = identifiant conducteur
    user_id: user.id,
    full_name: user.name,
    email: user.email,
    phone: user.phone || profile?.mobile_money_number || null,
    avatar_url: user.avatar_url || null,
    vehicle_type: profile?.vehicle_type || "",
    vehicle_plate: profile?.vehicle_plate || "",
    license_url: profile?.license_url || null,
    id_url: profile?.id_card_url || null,
    status: approved ? "approved" : "pending",
    is_available: profile?.is_available ? "true" : "false",
    rating: "0",
    total_deliveries: profile?.completed_deliveries || 0,
    completed_deliveries: profile?.completed_deliveries || 0,
    total_earnings: String(profile?.total_earned || 0),
    current_lat: profile?.current_latitude ?? null,
    current_lng: profile?.current_longitude ?? null,
    last_location_update: null,
    created_at: profile?.created_at || user.created_at,
    updated_at: profile ? new Date().toISOString() : null,
  };
}

async function fetchProfiles(userIds: string[]): Promise<Map<string, RawProfile>> {
  const supabase = getSupabaseClient();
  if (!userIds.length) return new Map();
  const { data, error } = await supabase.from("driver_profiles").select("*").in("user_id", userIds);
  if (error) throw error;
  return new Map((data || []).map((p) => [p.user_id, p]));
}

async function fetchAllDrivers() {
  const supabase = getSupabaseClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "driver");
  if (error) throw error;
  const profileMap = await fetchProfiles((users || []).map((u) => u.id));
  const rows: any[] = [];
  for (const u of users || []) {
    rows.push(await buildDriver(u, profileMap.get(u.id) || null));
  }
  return rows;
}

// GET /api/drivers - liste conducteurs (filtres, tri, pagination en mémoire)
router.get("/api/drivers", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string || "").toLowerCase();
    const status = req.query.status as string;
    const availability = req.query.availability as string;
    const vehicleType = req.query.vehicleType as string;
    const sortBy = (req.query.sortBy as string) || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    let rows = await fetchAllDrivers();

    if (status) rows = rows.filter((r) => r.status === status);
    if (availability) rows = rows.filter((r) => r.is_available === availability);
    if (vehicleType) rows = rows.filter((r) => r.vehicle_type === vehicleType);
    if (search) {
      rows = rows.filter((r) =>
        String(r.full_name || "").toLowerCase().includes(search) ||
        String(r.phone || "").toLowerCase().includes(search) ||
        String(r.email || "").toLowerCase().includes(search)
      );
    }

    rows.sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (av < bv) return -1 * sortOrder;
      if (av > bv) return 1 * sortOrder;
      return 0;
    });

    const total = rows.length;
    const from = (page - 1) * pageSize;
    const data = rows.slice(from, from + pageSize);
    res.json({ success: true, data, total, page, pageSize });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/drivers/active - conducteurs actifs (validés, en ligne, géolocalisés)
router.get("/api/drivers/active", async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "driver")
      .eq("is_active", true);
    if (error) throw error;

    const ids = (users || []).map((u) => u.id);
    const { data: profiles, error: pErr } = await supabase
      .from("driver_profiles")
      .select("*")
      .in("user_id", ids.length ? ids : [""])
      .eq("is_approved", true)
      .eq("is_available", true)
      .not("current_latitude", "is", null)
      .not("current_longitude", "is", null);
    if (pErr) throw pErr;

    const profileByUser = new Map((profiles || []).map((p) => [p.user_id, p]));
    const result = [];
    for (const u of users || []) {
      const profile = profileByUser.get(u.id);
      if (profile) result.push(await buildDriver(u, profile));
    }
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/drivers/:id - détail conducteur
router.get("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error) throw error;
    if (!user) return res.status(404).json({ success: false, error: "Driver not found" });

    const { data: profiles } = await supabase.from("driver_profiles").select("*").eq("user_id", id).limit(1);
    const profile = (profiles || [])[0] || null;
    const driver = await buildDriver(user, profile);

    // Livraisons (tables `deliveries`), transactions (wallet_transactions)
    const { data: deliveries } = await supabase
      .from("deliveries")
      .select("*")
      .eq("driver_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: tx } = await supabase
      .from("wallet_transactions")
      .select("*")
      .or(`driver_id.eq.${id},user_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(20);

    const deliveryList = (deliveries || []).map((d: any) => ({
      id: d.id,
      user_id: id,
      order_id: d.order_id,
      status: d.status,
      distance: null,
      delivery_fee: null,
      completed_at: null,
      created_at: d.created_at,
    }));

    const transactions = (tx || []).map((t: any) => ({
      id: t.id,
      user_id: id,
      type: t.type,
      amount: String(t.amount ?? 0),
      description: t.description,
      status: t.status,
      created_at: t.created_at,
    }));

    const doneStatuses = ["delivered", "completed"];
    const inProgressStatuses = ["in_transit", "in-transit", "assigned", "accepted", "pickup", "picked_up"];
    const deliveryStats = {
      total: deliveryList.length,
      completed: deliveryList.filter((d) => doneStatuses.includes(d.status)).length,
      inProgress: deliveryList.filter((d) => inProgressStatuses.includes(d.status)).length,
      avgTime: "25分钟",
    };

    res.json({ success: true, data: { ...driver, deliveries: deliveryList, transactions, deliveryStats } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// PUT /api/drivers/:id - mise à jour (bascule disponibilité principalement)
router.put("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const body = req.body || {};

    const { data: profiles } = await supabase.from("driver_profiles").select("*").eq("user_id", id).limit(1);
    const profile = (profiles || [])[0];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.is_available !== undefined) {
      const avail = typeof body.is_available === "boolean" ? body.is_available : body.is_available === "true";
      updates.is_available = avail;
    }
    if (body.is_approved !== undefined) {
      updates.is_approved = typeof body.is_approved === "boolean" ? body.is_approved : body.is_approved === "true";
      if (updates.is_approved) updates.approved_at = new Date().toISOString();
    }
    // champs optionnels compatibles
    if (body.vehicle_type !== undefined) updates.vehicle_type = body.vehicle_type;
    if (body.vehicle_plate !== undefined) updates.vehicle_plate = body.vehicle_plate;
    if (body.current_latitude !== undefined) updates.current_latitude = body.current_latitude;
    if (body.current_longitude !== undefined) updates.current_longitude = body.current_longitude;

    if (profile) {
      const { data, error } = await supabase.from("driver_profiles").update(updates).eq("user_id", id).select().single();
      if (error) throw error;
      res.json({ success: true, data: await buildDriver({ id }, data as RawProfile) });
    } else {
      // Pas encore de profil : on le crée
      const insert: any = {
        id,
        user_id: id,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        completed_deliveries: 0,
        is_approved: false,
        is_available: updates.is_available ?? false,
        ...updates,
      };
      const { data, error } = await supabase.from("driver_profiles").insert(insert).select().single();
      if (error) throw error;
      res.json({ success: true, data: await buildDriver({ id }, data as RawProfile) });
    }
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// DELETE /api/drivers/:id - suppression
router.delete("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    await supabase.from("driver_profiles").delete().eq("user_id", id);
    await supabase.from("users").update({ is_active: false }).eq("id", id).eq("role", "driver");
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ─── Candidatures conducteur = verifications(verification_role='driver') ────

async function fetchDriverApplicationUser(userId: string | null) {
  if (!userId) return null;
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("users").select("id,name,email,phone").eq("id", userId).single();
  return data || null;
}

function mapApplication(row: any, user: any) {
  return {
    id: row.id,
    user_id: row.user_id || null,
    full_name: row.full_name || user?.name || "—",
    email: user?.email || null,
    phone: user?.phone || null,
    vehicle_type: row.vehicle_type || null,
    vehicle_plate: null,
    license_url: row.driving_license_url || null,
    id_url: row.id_front_url || null,
    status: row.status || "pending",
    notes: row.rejection_reason || null,
    reviewed_by: row.reviewed_by || null,
    reviewed_at: row.reviewed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/driver-applications
router.get("/api/driver-applications", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const status = req.query.status as string;

    let query: any = supabase
      .from("verifications")
      .select("*", { count: "exact" })
      .eq("verification_role", "driver");
    if (status) query = query.eq("status", status);

    const { data, count, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    const result = [];
    for (const row of data || []) {
      const user = await fetchDriverApplicationUser(row.user_id);
      result.push(mapApplication(row, user));
    }
    res.json({ success: true, data: result, total: count || 0 });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/driver-applications/:id
router.get("/api/driver-applications/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .eq("id", req.params.id)
      .eq("verification_role", "driver")
      .single();
    if (error) throw error;
    const user = await fetchDriverApplicationUser(data.user_id);
    res.json({ success: true, data: mapApplication(data, user) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// PUT /api/driver-applications/:id - approuver / rejeter
router.put("/api/driver-applications/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ success: false, error: "Status must be 'approved' or 'rejected'" });
      return;
    }

    const { data: app, error: fetchError } = await supabase
      .from("verifications")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    if (!app) return res.status(404).json({ success: false, error: "Application not found" });

    const { data, error } = await supabase
      .from("verifications")
      .update({
        status,
        rejection_reason: status === "rejected" ? notes || null : null,
        reviewed_by: "admin",
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (status === "approved" && app.user_id) {
      // s'assurer que l'utilisateur est un conducteur
      await supabase.from("users").update({ role: "driver", verification_status: "verified" }).eq("id", app.user_id);

      const { data: existing } = await supabase.from("driver_profiles").select("id").eq("user_id", app.user_id).maybeSingle();
      if (!existing) {
        await supabase.from("driver_profiles").insert({
          id: app.user_id,
          user_id: app.user_id,
          balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          completed_deliveries: 0,
          vehicle_type: app.vehicle_type || null,
          license_url: app.driving_license_url || null,
          id_card_url: app.id_front_url || null,
          is_approved: true,
          is_available: true,
          approved_at: new Date().toISOString(),
          approved_by: "admin",
        });
      } else {
        await supabase
          .from("driver_profiles")
          .update({ is_approved: true, is_available: true, approved_at: new Date().toISOString(), approved_by: "admin" })
          .eq("user_id", app.user_id);
      }
    }

    const user = await fetchDriverApplicationUser(app.user_id);
    res.json({ success: true, data: mapApplication(data, user) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
