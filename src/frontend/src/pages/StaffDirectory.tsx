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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type StaffProfile, UserRole } from "../backend";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKEL = ["s1", "s2", "s3", "s4"];
const SKEL_COLS = ["c1", "c2", "c3", "c4", "c5", "c6"];

const emptyProfile: StaffProfile = {
  employeeId: "",
  name: "",
  department: "",
  designation: "",
  role: UserRole.user,
};

export default function StaffDirectory() {
  const { actor, isFetching } = useActor();
  const { isAdmin } = useAppContext();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [form, setForm] = useState<StaffProfile>(emptyProfile);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => actor?.getAllStaff() ?? Promise.resolve([]),
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: (p: StaffProfile) => actor!.createStaffProfile(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff added");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to add staff"),
  });

  const updateMut = useMutation({
    mutationFn: (p: StaffProfile) => actor!.updateStaffProfile(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff updated");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to update staff"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteStaffProfile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff removed");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete staff"),
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyProfile, employeeId: `EMP-${Date.now()}` });
    setModalOpen(true);
  }
  function openEdit(p: StaffProfile) {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  }
  function handleSubmit() {
    if (!form.name || !form.department || !form.designation) {
      toast.error("Please fill all fields");
      return;
    }
    if (editing) updateMut.mutate(form);
    else createMut.mutate(form);
  }

  const isPending = createMut.isPending || updateMut.isPending;

  if (!isAdmin)
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Access restricted to administrators.
        </p>
      </div>
    );

  return (
    <div className="p-6 space-y-6" data-ocid="staff.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all hospital staff
          </p>
        </div>
        <Button data-ocid="staff.add.primary_button" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKEL.map((sk) => (
                <TableRow key={sk}>
                  {SKEL_COLS.map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : staff && staff.length > 0 ? (
              staff.map((s, i) => (
                <TableRow key={s.employeeId} data-ocid={`staff.item.${i + 1}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.employeeId}
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.designation}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.role === UserRole.admin ? "default" : "secondary"
                      }
                      className="capitalize"
                    >
                      {s.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-ocid={`staff.edit_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-ocid={`staff.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(s.employeeId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div
                    className="flex flex-col items-center gap-2"
                    data-ocid="staff.empty_state"
                  >
                    <Users className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      No staff records yet.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="staff.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Staff" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input
                data-ocid="staff.input"
                value={form.employeeId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employeeId: e.target.value }))
                }
                disabled={!!editing}
                placeholder="EMP-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Dr. Sarah Johnson"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                placeholder="Emergency Medicine"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input
                value={form.designation}
                onChange={(e) =>
                  setForm((p) => ({ ...p, designation: e.target.value }))
                }
                placeholder="Senior Consultant"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role: v as UserRole }))
                }
              >
                <SelectTrigger data-ocid="staff.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.user}>User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="staff.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="staff.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="staff.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="staff.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="staff.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
