import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type LeaveRequest, LeaveStatus } from "../backend";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKEL = ["s1", "s2", "s3"];
const SKEL_COLS6 = ["c1", "c2", "c3", "c4", "c5", "c6"];
const SKEL_COLS5 = ["c1", "c2", "c3", "c4", "c5"];

const statusColors: Record<LeaveStatus, string> = {
  [LeaveStatus.pending]: "bg-amber-100 text-amber-700 border-amber-200",
  [LeaveStatus.approved]: "bg-green-100 text-green-700 border-green-200",
  [LeaveStatus.rejected]: "bg-red-100 text-red-700 border-red-200",
};

export default function LeaveManagement() {
  const { actor, isFetching } = useActor();
  const { isAdmin, employeeId } = useAppContext();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const { data: leaves, isLoading } = useQuery({
    queryKey: ["leaves", employeeId, isAdmin],
    queryFn: () =>
      isAdmin
        ? (actor?.getAllLeaveRequests() ?? Promise.resolve([]))
        : (actor?.getStaffLeaveRequests(employeeId) ?? Promise.resolve([])),
    enabled: !!actor && !isFetching,
  });

  const submitMut = useMutation({
    mutationFn: (req: LeaveRequest) => actor!.submitLeaveRequest(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request submitted");
      setModalOpen(false);
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
    },
    onError: () => toast.error("Failed to submit request"),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeaveStatus }) =>
      actor!.updateLeaveStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  function handleSubmit() {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) {
      toast.error("Fill all fields");
      return;
    }
    submitMut.mutate({
      leaveId: crypto.randomUUID(),
      staffId: employeeId,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
      status: LeaveStatus.pending,
      submittedAt: BigInt(Date.now()) * BigInt(1_000_000),
    });
  }

  return (
    <div className="p-6 space-y-6" data-ocid="leave.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Review and approve leave requests"
              : "Submit and track your leave requests"}
          </p>
        </div>
        {!isAdmin && (
          <Button
            data-ocid="leave.add.primary_button"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Leave
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {isAdmin && <TableHead>Staff ID</TableHead>}
              <TableHead>Leave Type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKEL.map((sk) => (
                <TableRow key={sk}>
                  {(isAdmin ? SKEL_COLS6 : SKEL_COLS5).map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : leaves && leaves.length > 0 ? (
              leaves.map((l, i) => (
                <TableRow key={l.leaveId} data-ocid={`leave.item.${i + 1}`}>
                  {isAdmin && (
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.staffId}
                    </TableCell>
                  )}
                  <TableCell className="capitalize">{l.leaveType}</TableCell>
                  <TableCell>{l.startDate}</TableCell>
                  <TableCell>{l.endDate}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {l.reason}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusColors[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {l.status === LeaveStatus.pending && (
                        <div className="flex justify-end gap-1">
                          <Button
                            data-ocid={`leave.approve.button.${i + 1}`}
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() =>
                              statusMut.mutate({
                                id: l.leaveId,
                                status: LeaveStatus.approved,
                              })
                            }
                            disabled={statusMut.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            data-ocid={`leave.reject.button.${i + 1}`}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              statusMut.mutate({
                                id: l.leaveId,
                                status: LeaveStatus.rejected,
                              })
                            }
                            disabled={statusMut.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 5}
                  className="text-center py-12"
                >
                  <div
                    className="flex flex-col items-center gap-2"
                    data-ocid="leave.empty_state"
                  >
                    <ClipboardList className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      No leave requests found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="leave.dialog">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select
                value={form.leaveType}
                onValueChange={(v) => setForm((p) => ({ ...p, leaveType: v }))}
              >
                <SelectTrigger data-ocid="leave.select">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  data-ocid="leave.input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                data-ocid="leave.textarea"
                value={form.reason}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reason: e.target.value }))
                }
                rows={4}
                placeholder="Brief reason for leave..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="leave.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="leave.submit_button"
              onClick={handleSubmit}
              disabled={submitMut.isPending}
            >
              {submitMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
