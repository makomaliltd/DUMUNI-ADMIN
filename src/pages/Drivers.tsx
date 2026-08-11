import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrivers, useDeleteDriver, useUpdateDriver, Driver } from "@/hooks/useDrivers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Star, Bike, Truck, Car, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const vehicleIconMap: Record<string, React.ReactNode> = {
  "电动车": <Bike className="h-4 w-4" />,
  "摩托车": <Bike className="h-4 w-4" />,
  "小型汽车": <Car className="h-4 w-4" />,
  "三轮车": <Truck className="h-4 w-4" />,
};

export default function DriversPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [availability, setAvailability] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data, isLoading, error } = useDrivers({
    page, pageSize: 10, search, status, availability, vehicleType, sortBy, sortOrder,
  });

  const deleteDriver = useDeleteDriver();
  const updateDriver = useUpdateDriver();

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  const handleToggleAvailability = (driver: Driver) => {
    updateDriver.mutate({
      id: driver.id,
      data: { is_available: driver.is_available === "true" ? "false" : "true" },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t("drivers.deleteConfirm"))) {
      deleteDriver.mutate(id);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const totalPages = data ? Math.ceil(data.total / 10) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("drivers.subtitle2")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/drivers/tracking")}>
          <Navigation className="h-4 w-4 mr-2" />
          {t("drivers.liveTracking")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("drivers.searchPlaceholder2")}
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t("drivers.certStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">{t("drivers.allStatus")}</SelectItem>
            <SelectItem value="approved">{t("drivers.verified")}</SelectItem>
            <SelectItem value="pending">{t("drivers.pendingVerify")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={availability} onValueChange={(v) => { setAvailability(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t("drivers.onlineStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">{t("drivers.allStatus")}</SelectItem>
            <SelectItem value="true">{t("drivers.online")}</SelectItem>
            <SelectItem value="false">{t("drivers.offlineLabel")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vehicleType} onValueChange={(v) => { setVehicleType(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t("drivers.vehicleType")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">全部</SelectItem>
            <SelectItem value="电动车">电动车</SelectItem>
            <SelectItem value="摩托车">摩托车</SelectItem>
            <SelectItem value="小型汽车">小型汽车</SelectItem>
            <SelectItem value="三轮车">三轮车</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("full_name")}>{t("drivers.name")} <SortIcon col="full_name" /></TableHead>
              <TableHead>{t("drivers.phone")}</TableHead>
              <TableHead>{t("drivers.vehicleType")}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>{t("drivers.certStatus")} <SortIcon col="status" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("is_available")}>{t("drivers.onlineStatus")} <SortIcon col="is_available" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("total_deliveries")}>{t("drivers.deliveryCount")} <SortIcon col="total_deliveries" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("rating")}>{t("drivers.rating")} <SortIcon col="rating" /></TableHead>
              <TableHead className="text-right">{t("drivers.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{t("drivers.loading")}</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-red-500">{t("drivers.loadFailed")}</TableCell></TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{t("drivers.noDriversData")}</TableCell></TableRow>
            ) : (
              data?.data.map((driver) => (
                <TableRow key={driver.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/drivers/${driver.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {driver.full_name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">{driver.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{driver.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {vehicleIconMap[driver.vehicle_type] || <Bike className="h-4 w-4" />}
                      <span className="text-sm">{driver.vehicle_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={driver.status === "approved" ? "success" : "warning"}>
                      {driver.status === "approved" ? t("drivers.verified") : t("drivers.pendingVerify")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={driver.is_available === "true" ? "success" : "secondary"}>
                      {driver.is_available === "true" ? t("drivers.online") : t("drivers.offlineLabel")}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.total_deliveries}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{driver.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/drivers/${driver.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleAvailability(driver)}
                        title={driver.is_available === "true" ? t("drivers.markOffline") : t("drivers.markOnline")}
                      >
                        <Navigation className={`h-4 w-4 ${driver.is_available === "true" ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("drivers.totalRecords", { n: data?.total || 0 })}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-3">{t("drivers.pageOf", { n: page, m: totalPages })}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}