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

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    if (window.confirm("确定要删除该骑手吗？此操作不可撤销。")) {
      deleteDriver.mutate(driver.id);
      navigate("/drivers");
    }
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">加载中...</div>;
  if (error || !driver) return <div className="py-20 text-center text-red-500">加载失败或骑手不存在</div>;

  const vehicleIcon = driver.vehicle_type === "小型汽车" ? <Car className="h-5 w-5" /> :
    driver.vehicle_type === "三轮车" ? <Truck className="h-5 w-5" /> : <Bike className="h-5 w-5" />;

  const stats = driver.deliveryStats || { total: 0, completed: 0, inProgress: 0, avgTime: "0" };
  const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/drivers")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> 返回骑手列表
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
                {driver.status === "approved" ? "已认证" : "待认证"}
              </Badge>
              <Badge variant={driver.is_available === "true" ? "success" : "secondary"}>
                {driver.is_available === "true" ? "在线" : "离线"}
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
              {driver.status === "approved" ? "取消认证" : "认证通过"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="总配送单" value={stats.total.toString()} color="text-blue-600" bg="bg-blue-50" />
          <StatsCard icon={<CheckCircle className="h-5 w-5" />} label="完成配送" value={stats.completed.toString()} color="text-green-600" bg="bg-green-50" />
          <StatsCard icon={<Clock className="h-5 w-5" />} label="平均配送时间" value={stats.avgTime} color="text-amber-600" bg="bg-amber-50" />
          <StatsCard icon={<DollarSign className="h-5 w-5" />} label="总收入" value={`¥${parseFloat(driver.total_earnings || "0").toLocaleString()}`} color="text-primary" bg="bg-primary/5" />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="deliveries">配送历史</TabsTrigger>
          <TabsTrigger value="transactions">交易记录</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">配送统计</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-1">总配送单</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground mt-1">已完成</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground mt-1">进行中</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold">{successRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">成功率</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">配送历史</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>配送编号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>距离</TableHead>
                  <TableHead>配送费</TableHead>
                  <TableHead>完成时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driver.deliveries?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无配送记录</TableCell></TableRow>
                ) : (
                  driver.deliveries?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={
                          d.status === "completed" ? "success" :
                          d.status === "in_transit" ? "warning" : "secondary"
                        }>
                          {d.status === "completed" ? "已完成" : d.status === "in_transit" ? "配送中" : "已分配"}
                        </Badge>
                      </TableCell>
                      <TableCell>{d.distance} km</TableCell>
                      <TableCell>¥{d.delivery_fee}</TableCell>
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
            <h3 className="font-semibold mb-4">交易记录</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driver.transactions?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无交易记录</TableCell></TableRow>
                ) : (
                  driver.transactions?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Badge variant="outline">{t.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">¥{t.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "completed" ? "success" : "warning"}>
                          {t.status === "completed" ? "已完成" : "待处理"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
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