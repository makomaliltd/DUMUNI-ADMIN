import { useState } from "react";
import { useDriverApplications, useReviewDriverApplication, type DriverApplication } from "@/hooks/useDrivers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Search, Bike, Car, Truck } from "lucide-react";

export default function DriversApplicationsPage() {
  const { data, isLoading, error } = useDriverApplications();
  const reviewApp = useReviewDriverApplication();
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState("pending");

  const applications = data?.data || [];
  const pendingApps = applications.filter((a) => a.status === "pending");
  const reviewedApps = applications.filter((a) => a.status !== "pending");

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedApp) return;
    reviewApp.mutate({ id: selectedApp.id, status, notes });
    setSelectedApp(null);
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">骑手审核</h1>
        <p className="text-sm text-muted-foreground mt-1">
          待审核申请: <span className="font-semibold text-primary">{pendingApps.length}</span> 条
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">待审核 ({pendingApps.length})</TabsTrigger>
          <TabsTrigger value="reviewed">已审核 ({reviewedApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>交通工具</TableHead>
                  <TableHead>车牌号</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">加载中...</TableCell></TableRow>
                ) : pendingApps.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">暂无待审核申请</TableCell></TableRow>
                ) : (
                  pendingApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{app.phone}</TableCell>
                      <TableCell>{app.vehicle_type}</TableCell>
                      <TableCell className="font-mono text-sm">{app.vehicle_plate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => setSelectedApp(app)}>
                          <Search className="h-4 w-4 mr-1.5" /> 审核
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>交通工具</TableHead>
                  <TableHead>审核结果</TableHead>
                  <TableHead>审核备注</TableHead>
                  <TableHead>审核时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewedApps.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">暂无已审核记录</TableCell></TableRow>
                ) : (
                  reviewedApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{app.phone}</TableCell>
                      <TableCell>{app.vehicle_type}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === "approved" ? "success" : "destructive"}>
                          {app.status === "approved" ? "已通过" : "已拒绝"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{app.notes || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>审核骑手申请</DialogTitle>
            <DialogDescription>查看申请详情并进行审核</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">姓名</div>
                  <div className="font-medium">{selectedApp.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">邮箱</div>
                  <div className="font-medium">{selectedApp.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">手机号</div>
                  <div className="font-medium">{selectedApp.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">交通工具</div>
                  <div className="font-medium">{selectedApp.vehicle_type}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">车牌号</div>
                  <div className="font-medium">{selectedApp.vehicle_plate}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">行驶证/身份证</div>
                <div className="p-8 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                  证件文件预览区（图片上传功能待集成）
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">审核备注</label>
                <Textarea
                  placeholder="输入审核备注..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>取消</Button>
                <Button variant="destructive" onClick={() => handleReview("rejected")}>
                  <XCircle className="h-4 w-4 mr-1.5" /> 拒绝
                </Button>
                <Button onClick={() => handleReview("approved")}>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> 通过
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}