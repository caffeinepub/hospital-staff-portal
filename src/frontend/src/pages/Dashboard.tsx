import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, FileText, Users } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKELETON_ROWS = ["a", "b", "c"];

export default function Dashboard() {
  const { actor, isFetching } = useActor();
  const { isAdmin, employeeId } = useAppContext();

  const { data: staff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => actor?.getAllStaff() ?? Promise.resolve([]),
    enabled: !!actor && !isFetching && isAdmin,
  });

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => actor?.getAllNotices() ?? Promise.resolve([]),
    enabled: !!actor && !isFetching,
  });

  const { data: rosters } = useQuery({
    queryKey: ["rosters", employeeId, isAdmin],
    queryFn: () =>
      isAdmin
        ? (actor?.getAllRosters() ?? Promise.resolve([]))
        : (actor?.getStaffRosterEntries(employeeId) ?? Promise.resolve([])),
    enabled: !!actor && !isFetching,
  });

  const { data: leaves } = useQuery({
    queryKey: ["leaves", employeeId, isAdmin],
    queryFn: () =>
      isAdmin
        ? (actor?.getAllLeaveRequests() ?? Promise.resolve([]))
        : (actor?.getStaffLeaveRequests(employeeId) ?? Promise.resolve([])),
    enabled: !!actor && !isFetching,
  });

  const kpis = [
    {
      label: "Total Staff",
      value: isAdmin ? (staff?.length ?? 0) : "—",
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ocid: "dashboard.staff.card",
    },
    {
      label: "Upcoming Shifts",
      value: rosters?.length ?? 0,
      icon: <CalendarDays className="w-5 h-5" />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      ocid: "dashboard.shifts.card",
    },
    {
      label: "Active Notices",
      value: notices?.length ?? 0,
      icon: <Bell className="w-5 h-5" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ocid: "dashboard.notices.card",
    },
    {
      label: "Leave Requests",
      value: leaves?.length ?? 0,
      icon: <FileText className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      ocid: "dashboard.leaves.card",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-ocid="dashboard.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back · Hospital Administration Portal
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            data-ocid={kpi.ocid}
            className="shadow-card border-border"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} ${kpi.color} p-2.5 rounded-lg`}>
                  {kpi.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {noticesLoading ? (
              SKELETON_ROWS.map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))
            ) : notices && notices.length > 0 ? (
              notices.slice(0, 5).map((n, i) => (
                <div
                  key={n.noticeId}
                  data-ocid={`dashboard.notice.item.${i + 1}`}
                  className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(
                        Number(n.publishedAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs shrink-0"
                  >
                    {n.category}
                  </Badge>
                </div>
              ))
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="dashboard.notices.empty_state"
              >
                No notices yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rosters && rosters.length > 0 ? (
              rosters.slice(0, 5).map((r, i) => (
                <div
                  key={r.rosterId}
                  data-ocid={`dashboard.shift.item.${i + 1}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{r.wardAssignment}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {r.shiftTiming}
                  </Badge>
                </div>
              ))
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="dashboard.shifts.empty_state"
              >
                No upcoming shifts.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
