import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RosterEntry } from "../backend";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKEL = ["s1", "s2", "s3"];
const SKEL_COLS5 = ["c1", "c2", "c3", "c4", "c5"];
const SKEL_COLS4 = ["c1", "c2", "c3", "c4"];

const emptyEntry: RosterEntry = {
  rosterId: "",
  staffId: "",
  date: "",
  shiftTiming: "",
  wardAssignment: "",
};

export default function DutyRoster() {
  const { actor, isFetching } = useActor();
  const { isAdmin, employeeId } = useAppContext();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RosterEntry | null>(null);
  const [form, setForm] = useState<RosterEntry>(emptyEntry);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: rosters, isLoading } = useQuery({
    queryKey: ["rosters", employeeId, isAdmin],
    queryFn: () =>
      isAdmin
        ? (actor?.getAllRosters() ?? Promise.resolve([]))
        : (actor?.getStaffRosterEntries(employeeId) ?? Promise.resolve([])),
    enabled: !!actor && !isFetching,
  });

  const assignMut = useMutation({
    mutationFn: (e: RosterEntry) => actor!.assignShift(e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rosters"] });
      toast.success("Shift assigned");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to assign shift"),
  });

  const updateMut = useMutation({
    mutationFn: (e: RosterEntry) => actor!.updateRosterEntry(e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rosters"] });
      toast.success("Roster updated");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to update roster"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteRosterEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rosters"] });
      toast.success("Entry removed");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete entry"),
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyEntry,
      rosterId: crypto.randomUUID(),
      staffId: employeeId,
    });
    setModalOpen(true);
  }
  function openEdit(e: RosterEntry) {
    setEditing(e);
    setForm({ ...e });
    setModalOpen(true);
  }
  function handleSubmit() {
    if (
      !form.staffId ||
      !form.date ||
      !form.shiftTiming ||
      !form.wardAssignment
    ) {
      toast.error("Fill all fields");
      return;
    }
    if (editing) updateMut.mutate(form);
    else assignMut.mutate(form);
  }

  const isPending = assignMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6" data-ocid="roster.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duty Roster</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Manage all shift assignments" : "Your assigned shifts"}
          </p>
        </div>
        {isAdmin && (
          <Button data-ocid="roster.add.primary_button" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Shift
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Staff ID</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Ward</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKEL.map((sk) => (
                <TableRow key={sk}>
                  {(isAdmin ? SKEL_COLS5 : SKEL_COLS4).map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rosters && rosters.length > 0 ? (
              rosters.map((r, i) => (
                <TableRow key={r.rosterId} data-ocid={`roster.item.${i + 1}`}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.staffId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.shiftTiming}</Badge>
                  </TableCell>
                  <TableCell>{r.wardAssignment}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          data-ocid={`roster.edit_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          data-ocid={`roster.delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r.rosterId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 5 : 4}
                  className="text-center py-12"
                >
                  <div
                    className="flex flex-col items-center gap-2"
                    data-ocid="roster.empty_state"
                  >
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      No roster entries found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="roster.dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shift" : "Assign Shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Staff ID</Label>
              <Input
                data-ocid="roster.input"
                value={form.staffId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, staffId: e.target.value }))
                }
                placeholder="EMP-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shift Timing</Label>
              <Input
                value={form.shiftTiming}
                onChange={(e) =>
                  setForm((p) => ({ ...p, shiftTiming: e.target.value }))
                }
                placeholder="07:00 – 15:00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ward Assignment</Label>
              <Input
                value={form.wardAssignment}
                onChange={(e) =>
                  setForm((p) => ({ ...p, wardAssignment: e.target.value }))
                }
                placeholder="ICU Ward 3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="roster.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="roster.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="roster.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Roster Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This shift assignment will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="roster.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="roster.confirm_button"
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
