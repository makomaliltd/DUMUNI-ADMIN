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
import { useLanguage } from "@/contexts/LanguageContext";

export default function DriversApplicationsPage() {
  const { data, isLoading, error } = useDriverApplications();
  const reviewApp = useReviewDriverApplication();
  const { t } = useLanguage();
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
        <h1 className="text-2xl font-bold tracking-tight">{t("driverApplications.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("driverApplications.pendingCount", { n: pendingApps.length })}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">{t("driverApplications.pending")} ({pendingApps.length})</TabsTrigger>
          <TabsTrigger value="reviewed">{t("driverApplications.reviewed")} ({reviewedApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("driverApplications.name")}</TableHead>
                  <TableHead>{t("driverApplications.phone")}</TableHead>
                  <TableHead>{t("driverApplications.vehicleType")}</TableHead>
                  <TableHead>{t("driverApplications.vehiclePlate")}</TableHead>
                  <TableHead>{t("driverApplications.applyTime")}</TableHead>
                  <TableHead className="text-right">{t("drivers.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("drivers.loading")}</TableCell></TableRow>
                ) : pendingApps.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("driverApplications.noPending")}</TableCell></TableRow>
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
                          <Search className="h-4 w-4 mr-1.5" /> {t("driverApplications.review")}
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
                  <TableHead>{t("driverApplications.name")}</TableHead>
                  <TableHead>{t("driverApplications.phone")}</TableHead>
                  <TableHead>{t("driverApplications.vehicleType")}</TableHead>
                  <TableHead>{t("driverApplications.reviewResult")}</TableHead>
                  <TableHead>{t("driverApplications.reviewNotes")}</TableHead>
                  <TableHead>{t("driverApplications.reviewTime")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewedApps.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("driverApplications.noReviewed")}</TableCell></TableRow>
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
            <DialogTitle>{t("driverApplications.reviewTitle")}</DialogTitle>
            <DialogDescription>{t("driverApplications.reviewDesc")}</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.name")}</div>
                  <div className="font-medium">{selectedApp.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.email")}</div>
                  <div className="font-medium">{selectedApp.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.phone")}</div>
                  <div className="font-medium">{selectedApp.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.vehicleType")}</div>
                  <div className="font-medium">{selectedApp.vehicle_type}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.vehiclePlate")}</div>
                  <div className="font-medium">{selectedApp.vehicle_plate}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">{t("driverApplications.documents")}</div>
                <div className="p-8 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                  {t("driverApplications.documentPlaceholder")}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("driverApplications.reviewNotesLabel")}</label>
                <Textarea
                  placeholder={t("driverApplications.reviewNotesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedApp(null)}>{t("driverApplications.cancel")}</Button>
                <Button variant="destructive" onClick={() => handleReview("rejected")}>
                  <XCircle className="h-4 w-4 mr-1.5" /> {t("driverApplications.reject")}
                </Button>
                <Button onClick={() => handleReview("approved")}>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> {t("driverApplications.approve")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}