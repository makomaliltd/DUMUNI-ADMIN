import { Router, Request, Response } from "express";
import { getSupabaseClient } from "../src/storage/database/supabase-client";

const router = Router();

// GET /api/drivers - List drivers with filters
router.get("/api/drivers", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const availability = req.query.availability as string;
    const vehicleType = req.query.vehicleType as string;
    const sortBy = req.query.sortBy as string || "created_at";
    const sortOrder = req.query.sortOrder as string || "desc";

    let query = supabase.from("drivers").select("*", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (availability) {
      query = query.eq("is_available", availability);
    }
    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType);
    }

    const validSortCols = ["full_name", "status", "total_deliveries", "rating", "created_at", "is_available", "vehicle_type"];
    const orderCol = validSortCols.includes(sortBy) ? sortBy : "created_at";
    const order = sortOrder === "asc" ? { ascending: true } : { ascending: false };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order(orderCol, order)
      .range(from, to);

    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0, page, pageSize });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/drivers/active - Get all active drivers with locations
router.get("/api/drivers/active", async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("status", "approved")
      .eq("is_available", "true")
      .not("current_lat", "is", null)
      .not("current_lng", "is", null);

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/drivers/:id - Driver detail
router.get("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data: driver, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!driver) {
      res.status(404).json({ success: false, error: "Driver not found" });
      return;
    }

    // Get delivery stats
    const { data: deliveries } = await supabase
      .from("delivery_records")
      .select("*")
      .eq("user_id", driver.user_id)
      .order("created_at", { ascending: false });

    // Get transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", driver.user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    res.json({
      success: true,
      data: {
        ...driver,
        deliveries: deliveries || [],
        transactions: transactions || [],
        deliveryStats: {
          total: deliveries?.length || 0,
          completed: deliveries?.filter((d: { status: string }) => d.status === "completed").length || 0,
          inProgress: deliveries?.filter((d: { status: string }) => d.status === "in_transit" || d.status === "assigned").length || 0,
          avgTime: "25分钟",
        },
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// PUT /api/drivers/:id - Update driver
router.put("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("drivers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// DELETE /api/drivers/:id - Delete driver
router.delete("/api/drivers/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ─── Driver Applications ────────────────────────────────────────

// GET /api/driver-applications
router.get("/api/driver-applications", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const status = req.query.status as string;

    let query = supabase.from("driver_applications").select("*", { count: "exact" });
    if (status) query = query.eq("status", status);

    const { data, count, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [], total: count || 0 });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /api/driver-applications/:id
router.get("/api/driver-applications/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("driver_applications")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// PUT /api/driver-applications/:id - Approve/Reject
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
      .from("driver_applications")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from("driver_applications")
      .update({
        status,
        notes: notes || null,
        reviewed_by: "admin",
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // If approved, create driver record
    if (status === "approved") {
      const existing = await supabase.from("drivers").select("id").eq("user_id", app.user_id).maybeSingle();
      if (!existing.data) {
        await supabase.from("drivers").insert({
          user_id: app.user_id,
          full_name: app.full_name,
          email: app.email,
          phone: app.phone,
          vehicle_type: app.vehicle_type,
          vehicle_plate: app.vehicle_plate,
          license_url: app.license_url,
          id_url: app.id_url,
          status: "approved",
          is_available: "true",
          rating: "0",
          total_deliveries: 0,
          completed_deliveries: 0,
          total_earnings: "0",
        });
      }
    }

    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;