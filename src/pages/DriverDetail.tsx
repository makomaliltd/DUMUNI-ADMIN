import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDriver, useUpdateDriver, useDeleteDriver } from "@/hooks/useDrivers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Star, Phone, Mail, Bike, Car, Truck, MapPin, Clock, TrendingUp, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data, isLoading, error } = useDriver(id || "");
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const [activeTab, setActiveTab] = useState("overview");

  const driver = data?.data;

  const handleToggleStatus = () => {
    if (!driver) return;
    const newStatus = driver.status === "approved" ? "pending" : "approved";
    updateDriver.mutate({ id: driver.id, data: { status: newStatus } });
  };

  const handleDelete = () => {
    if (!driver) return;
    if (window.confirm(t("driverDetail.deleteConfirm"))) {
      deleteDriver.mutate(driver.id);
      navigate("/drivers");
    }
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t("driverDetail.loading")}</div>;
  if (error || !driver) return <div className="py-20 text-center text-red-500">{t("driverDetail.loadFailed")}</div>;

  const vehicleIcon = driver.vehicle_type === "小型汽车" ? <Car className="h-5 w-5" /> :
    driver.vehicle_type === "三轮车" ? <Truck className="h-5 w-5" /> : <Bike className="h-5 w-5" />;

  const stats = driver.deliveryStats || { total: 0, completed: 0, inProgress: 0, avgTime: "0" };
  const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/drivers")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("driverDetail.backToDrivers")}
      </Button>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {driver.full_name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{driver.full_name}</h1>
              <Badge variant={driver.status === "approved" ? "success" : "warning"}>
                {driver.status === "approved" ? t("driverDetail.verified") : t("driverDetail.pendingVerify")}
              </Badge>
              <Badge variant={driver.is_available === "true" ? "success" : "secondary"}>
                {driver.is_available === "true" ? t("driverDetail.online") : t("driverDetail.offlineLabel")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {driver.phone}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {driver.email}</span>
              <span className="flex items-center gap-1">{vehicleIcon} {driver.vehicle_type} · {driver.vehicle_plate}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {driver.rating}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={handleToggleStatus}>
              {driver.status === "approved" ? t("driverDetail.unverify") : t("driverDetail.approve")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>{t("driverDetail.delete")}</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label={t("driverDetail.totalDeliveries")} value={stats.total.toString()} color="text-blue-600" bg="bg-blue-50" />
          <StatsCard icon={<CheckCircle className="h-5 w-5" />} label={t("driverDetail.completedDeliveries")} value={stats.completed.toString()} color="text-green-600" bg="bg-green-50" />
          <StatsCard icon={<Clock className="h-5 w-5" />} label={t("driverDetail.avgDeliveryTime")} value={stats.avgTime} color="text-amber-600" bg="bg-amber-50" />
          <StatsCard icon={<DollarSign className="h-5 w-5" />} label={t("driverDetail.totalEarnings")} value={formatCurrency(parseFloat(driver.total_earnings || "0"))} color="text-primary" bg="bg-primary/5" />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("driverDetail.overview")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("driverDetail.deliveryHistory")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("driverDetail.transactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t("driverDetail.deliveryStats")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-1">{t("driverDetail.totalDeliveries")}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground mt-1">{t("driverDetail.completed")}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground mt-1">{t("driverDetail.inProgress")}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{successRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">{t("driverDetail.successRate")}</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t("driverDetail.deliveryHistory")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("driverDetail.deliveryId")}</TableHead>
                  <TableHead>{t("drivers.status")}</TableHead>
                  <TableHead>{t("driverDetail.distance")}</TableHead>
                  <TableHead>{t("driverDetail.deliveryFee")}</TableHead>
                  <TableHead>{t("driverDetail.completedTime")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driver.deliveries?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("driverDetail.noDeliveryRecords")}</TableCell></TableRow>
                ) : (
                  driver.deliveries?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={
                          d.status === "completed" ? "success" :
                          d.status === "in_transit" ? "warning" : "secondary"
                        }>
                          {d.status === "completed" ? t("driverDetail.completed") : d.status === "in_transit" ? t("driverDetail.delivering") : t("driverDetail.assigned")}
                        </Badge>
                      </TableCell>
                      <TableCell>{d.distance} km</TableCell>
                      <TableCell>{formatCurrency(d.delivery_fee as unknown as number | string)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.completed_at ? new Date(d.completed_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{t("driverDetail.transactions")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("driverDetail.type")}</TableHead>
                  <TableHead>{t("driverDetail.amount")}</TableHead>
                  <TableHead>{t("driverDetail.description")}</TableHead>
                  <TableHead>{t("drivers.status")}</TableHead>
                  <TableHead>{t("driverDetail.time")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driver.transactions?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("driverDetail.noTransactionRecords")}</TableCell></TableRow>
                ) : (
                  driver.transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Badge variant="outline">{tx.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(tx.amount as unknown as number | string)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "completed" ? "success" : "warning"}>
                          {tx.status === "completed" ? t("driverDetail.completed") : t("drivers.pendingVerify")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg p-4`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}