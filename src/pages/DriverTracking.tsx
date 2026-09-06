import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveDrivers, Driver } from "@/hooks/useDrivers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Navigation, MapPin, RotateCcw, Store } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiUrl } from "@/lib/api";

// Fix Leaflet default icon
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

type Layer = "all" | "drivers" | "restaurants";

interface RestaurantGeo {
  id: string;
  name: string;
  address: string | null;
  cuisine_type: string | null;
  phone: string | null;
  rating: number | null;
  is_open: boolean;
  is_verified: boolean;
  logo_url: string | null;
  lat: number | null;
  lng: number | null;
  has_coords: boolean;
}

const createDriverIcon = (isAvailable: string) => {
  const color = isAvailable === "true" ? "#22c55e" : "#6b7280";
  return L.divIcon({
    className: "driver-marker",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 14px; font-weight: bold;
    ">🏍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

const createRestaurantIcon = () =>
  L.divIcon({
    className: "restaurant-marker",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: #f97316; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 15px;
    ">🍽️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });

// Centre par défaut : Bamako (Mali) — la plateforme opère en Afrique de l'Ouest.
const DEFAULT_CENTER: [number, number] = [12.6392, -8.0029];
const DEFAULT_ZOOM = 12;

function FitController({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  const fittedRef = useRef("");

  useEffect(() => {
    if (points.length === 0) return;
    const key = points.map((p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).sort().join("|");
    if (key === fittedRef.current) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
    fittedRef.current = key;
  }, [map, points]);

  return null;
}

export default function DriverTrackingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data, isLoading, refetch } = useActiveDrivers();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [layer, setLayer] = useState<Layer>("all");

  const [restaurants, setRestaurants] = useState<RestaurantGeo[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const drivers = data?.data || [];

  // Chargement des restaurants géolocalisés
  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    try {
      const res = await fetch(apiUrl("/api/restaurants/geo"));
      if (!res.ok) throw new Error("Failed to load restaurants");
      const json = await res.json();
      setRestaurants(json?.data || []);
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  // Auto-refresh des livreurs toutes les 30 s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { refetch(); }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const showDrivers = layer !== "restaurants";
  const showRestaurants = layer !== "drivers";

  const onMapRestaurants = restaurants.filter((r) => r.has_coords && r.lat != null && r.lng != null);
  const mapPoints: Array<[number, number]> = [
    ...(showDrivers
      ? drivers
          .filter((d) => d.current_lat != null && d.current_lng != null)
          .map((d) => [d.current_lat as number, d.current_lng as number] as [number, number])
      : []),
    ...(showRestaurants ? onMapRestaurants.map((r) => [r.lat as number, r.lng as number] as [number, number]) : []),
  ];

  const sectionBtn =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("driverTracking.liveTracking")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("driverTracking.onlineDrivers")}:{" "}
            <span className="font-semibold text-primary">{drivers.length}</span>{" "}
            {t("driverTracking.driversCount", { n: drivers.length })} ·{" "}
            {t("driverTracking.restaurantList")}:{" "}
            <span className="font-semibold text-orange-500">{restaurants.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/40">
            <span className="px-2 text-xs text-muted-foreground font-medium">{t("driverTracking.layerTitle")}</span>
            {(["all", "drivers", "restaurants"] as Layer[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayer(l)}
                className={`${sectionBtn} ${
                  layer === l
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-transparent hover:bg-muted"
                }`}
              >
                {l === "drivers" && <Navigation className="h-3.5 w-3.5" />}
                {l === "restaurants" && <Store className="h-3.5 w-3.5" />}
                {t(
                  l === "all"
                    ? "driverTracking.layerAll"
                    : l === "drivers"
                    ? "driverTracking.layerDrivers"
                    : "driverTracking.layerRestaurants"
                )}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => navigate("/drivers")}>
            <Navigation className="h-4 w-4 mr-2" />
            {t("driverTracking.driversList")}
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RotateCcw className={`h-4 w-4 mr-1.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {t("driverTracking.autoRefresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { refetch(); loadRestaurants(); }}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            {t("driverTracking.refresh")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 rounded-lg border overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 500 }}>
          {isLoading || loadingRestaurants ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">{t("driverTracking.loadingMap")}</div>
          ) : (
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={true}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitController points={mapPoints} />

              {showRestaurants &&
                onMapRestaurants.map((r) => (
                  <Marker
                    key={r.id}
                    position={[r.lat as number, r.lng as number]}
                    icon={createRestaurantIcon()}
                  >
                    <Popup>
                      <div className="text-sm min-w-[200px]">
                        <div className="font-semibold text-base mb-0.5 flex items-center gap-1">
                          <Store className="h-3.5 w-3.5 text-orange-500" /> {r.name}
                        </div>
                        <Badge variant={r.is_open ? "success" : "secondary"} className="mt-1">
                          {r.is_open ? t("restaurants.open") : t("restaurants.closed")}
                        </Badge>
                        <div className="space-y-0.5 text-muted-foreground mt-1.5">
                          <div>📍 {r.address || "—"}</div>
                          {r.cuisine_type ? <div>🍽️ {r.cuisine_type}</div> : null}
                          {r.rating != null ? <div>⭐ {Number(r.rating).toFixed(1)}</div> : null}
                          {r.phone ? <div>📞 {r.phone}</div> : null}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => navigate(`/restaurants/${r.id}`)}
                        >
                          {t("driverTracking.viewDetail")}
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {showDrivers &&
                drivers.map((driver) => (
                  <Marker
                    key={driver.id}
                    position={[driver.current_lat || DEFAULT_CENTER[0], driver.current_lng || DEFAULT_CENTER[1]]}
                    icon={createDriverIcon(driver.is_available)}
                    eventHandlers={{ click: () => setSelectedDriver(driver) }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <div className="font-semibold text-base mb-1">{driver.full_name}</div>
                        <div className="space-y-0.5 text-muted-foreground">
                          <div>🚗 {driver.vehicle_type} · {driver.vehicle_plate}</div>
                          <div>📞 {driver.phone}</div>
                          <div>⭐ {driver.rating} · {t("driverTracking.orders", { n: driver.total_deliveries })}</div>
                          <Badge variant={driver.is_available === "true" ? "success" : "secondary"} className="mt-1">
                            {driver.is_available === "true" ? t("driverTracking.onlineDrivers") : t("drivers.offlineLabel")}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => navigate(`/drivers/${driver.id}`)}
                        >
                          {t("driverTracking.viewDetail")}
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

              {mapPoints.length === 0 && (
                <div className="leaflet-bottom leaflet-left z-[1000] m-3">
                  <div className="bg-white/95 rounded-md shadow px-3 py-2 text-xs text-muted-foreground">
                    {t("driverTracking.noRestaurants")}
                  </div>
                </div>
              )}
            </MapContainer>
          )}
        </div>

        {/* Side list */}
        <div className="lg:col-span-1 rounded-lg border bg-card overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 500 }}>
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {layer === "restaurants"
                ? t("driverTracking.restaurantList")
                : layer === "all"
                ? t("driverTracking.layerAll")
                : t("driverTracking.onlineDriverList")}
            </h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-45px)]">
            {showRestaurants &&
              restaurants.map((r) => (
                <div
                  key={r.id}
                  className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => r.has_coords && setLayer("restaurants")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-orange-500" /> {r.name}
                    </span>
                    <Badge variant={r.is_open ? "success" : "secondary"} className="text-[10px] px-1.5">
                      {r.is_open ? t("restaurants.open") : t("restaurants.closed")}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{r.address || "—"}</div>
                  {!r.has_coords && (
                    <p className="text-[10px] mt-1 text-amber-600">⚠ pas de coordonnées GPS</p>
                  )}
                </div>
              ))}
            {showDrivers &&
              drivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedDriver?.id === driver.id ? "bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{driver.full_name}</span>
                    <Badge variant={driver.is_available === "true" ? "success" : "secondary"} className="text-[10px] px-1.5">
                      {driver.is_available === "true" ? t("drivers.online") : t("drivers.offlineLabel")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {t("driverTracking.coordinates")}: {driver.current_lat?.toFixed(4)}, {driver.current_lng?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{driver.vehicle_type}</span>
                    <span>⭐ {driver.rating}</span>
                    <span>{t("driverTracking.orders", { n: driver.total_deliveries })}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
