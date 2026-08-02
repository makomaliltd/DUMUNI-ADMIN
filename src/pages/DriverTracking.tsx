import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveDrivers, Driver } from "@/hooks/useDrivers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RefreshCw, Navigation, Bike, Car, Truck, MapPin, RotateCcw } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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

// Beijing center
const DEFAULT_CENTER: [number, number] = [39.9042, 116.4074];

function MapController({ drivers }: { drivers: Driver[] }) {
  const map = useMap();
  const fitDone = useRef(false);

  useEffect(() => {
    if (drivers.length > 0 && !fitDone.current) {
      const bounds = L.latLngBounds(
        drivers.map((d) => [d.current_lat || DEFAULT_CENTER[0], d.current_lng || DEFAULT_CENTER[1]] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
      fitDone.current = true;
    }
  }, [drivers, map]);

  return null;
}

export default function DriverTrackingPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useActiveDrivers();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const drivers = data?.data || [];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { refetch(); }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">骑手实时追踪</h1>
          <p className="text-sm text-muted-foreground mt-1">
            当前在线骑手: <span className="font-semibold text-primary">{drivers.length}</span> 人
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/drivers")}>
            <Navigation className="h-4 w-4 mr-2" />
            骑手列表
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RotateCcw className={`h-4 w-4 mr-1.5 ${autoRefresh ? "animate-spin" : ""}`} />
            自动刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 rounded-lg border overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">加载地图数据...</div>
          ) : (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController drivers={drivers} />
              {drivers.map((driver) => (
                <Marker
                  key={driver.id}
                  position={[driver.current_lat || DEFAULT_CENTER[0], driver.current_lng || DEFAULT_CENTER[1]]}
                  icon={createDriverIcon(driver.is_available)}
                  eventHandlers={{
                    click: () => setSelectedDriver(driver),
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <div className="font-semibold text-base mb-1">{driver.full_name}</div>
                      <div className="space-y-0.5 text-muted-foreground">
                        <div>🚗 {driver.vehicle_type} · {driver.vehicle_plate}</div>
                        <div>📞 {driver.phone}</div>
                        <div>⭐ {driver.rating} · {driver.total_deliveries} 单</div>
                        <Badge variant={driver.is_available === "true" ? "success" : "secondary"} className="mt-1">
                          {driver.is_available === "true" ? "在线" : "离线"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => navigate(`/drivers/${driver.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Driver List */}
        <div className="lg:col-span-1 rounded-lg border bg-card overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">在线骑手列表</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-45px)]">
            {drivers.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无在线骑手</div>
            ) : (
              drivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedDriver?.id === driver.id ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    setSelectedDriver(driver);
                    // Scroll map to this driver
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{driver.full_name}</span>
                    <Badge variant={driver.is_available === "true" ? "success" : "secondary"} className="text-[10px] px-1.5">
                      {driver.is_available === "true" ? "在线" : "离线"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {driver.current_lat?.toFixed(4)}, {driver.current_lng?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{driver.vehicle_type}</span>
                    <span>⭐ {driver.rating}</span>
                    <span>{driver.total_deliveries} 单</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}