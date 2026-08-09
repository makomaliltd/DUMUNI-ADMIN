import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";

const API_BASE = "";

export interface Driver {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_plate: string;
  license_url: string | null;
  id_url: string | null;
  status: string;
  is_available: string;
  rating: string;
  total_deliveries: number;
  completed_deliveries: number;
  total_earnings: string;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DriverDetail extends Driver {
  deliveries: DriverDeliveryRecord[];
  transactions: DriverTransaction[];
  deliveryStats: {
    total: number;
    completed: number;
    inProgress: number;
    avgTime: string;
  };
}

export interface DriverDeliveryRecord {
  id: string;
  user_id: string;
  order_id: string;
  status: string;
  distance: string;
  delivery_fee: string;
  completed_at: string | null;
  created_at: string;
}

export interface DriverTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  created_at: string;
}

export interface DriverApplication {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  license_url: string | null;
  id_url: string | null;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DriversResponse {
  success: boolean;
  data: Driver[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApplicationsResponse {
  success: boolean;
  data: DriverApplication[];
  total: number;
}

interface DriversQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  availability?: string;
  vehicleType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useDrivers(params: DriversQueryParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });

  return useQuery<DriversResponse>({
    queryKey: ["drivers", params],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/drivers?${searchParams.toString()}`));
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });
}

export function useDriver(id: string) {
  return useQuery<{ success: boolean; data: DriverDetail }>({
    queryKey: ["driver", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/drivers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch driver");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useActiveDrivers() {
  return useQuery<{ success: boolean; data: Driver[] }>({
    queryKey: ["drivers", "active"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/drivers/active`);
      if (!res.ok) throw new Error("Failed to fetch active drivers");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: driverData }: { id: string; data: Partial<Driver> }) => {
      const res = await fetch(apiUrl(`/api/drivers/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverData),
      });
      if (!res.ok) throw new Error("Failed to update driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/drivers/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

// ─── Driver Applications ──────────────────────────────────

export function useDriverApplications(status?: string) {
  return useQuery<ApplicationsResponse>({
    queryKey: ["driver-applications", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(apiUrl(`/api/driver-applications${params}`));
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });
}

export function useDriverApplication(id: string) {
  return useQuery<{ success: boolean; data: DriverApplication }>({
    queryKey: ["driver-application", id],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/driver-applications/${id}`));
      if (!res.ok) throw new Error("Failed to fetch application");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useReviewDriverApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(apiUrl(`/api/driver-applications/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to review application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}