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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Notice, NoticeCategory } from "../backend";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKEL = ["s1", "s2", "s3"];

const emptyNotice: Notice = {
  noticeId: "",
  title: "",
  content: "",
  category: NoticeCategory.memo,
  publishedAt: BigInt(0),
  publishedBy: "",
};

const categoryColors: Record<NoticeCategory, string> = {
  [NoticeCategory.circular]: "bg-blue-100 text-blue-700 border-blue-200",
  [NoticeCategory.memo]: "bg-amber-100 text-amber-700 border-amber-200",
  [NoticeCategory.policy]: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Notices() {
  const { actor, isFetching } = useActor();
  const { isAdmin, employeeId } = useAppContext();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState<Notice>(emptyNotice);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => actor?.getAllNotices() ?? Promise.resolve([]),
    enabled: !!actor && !isFetching,
  });

  const publishMut = useMutation({
    mutationFn: (n: Notice) => actor!.publishNotice(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice published");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to publish"),
  });

  const updateMut = useMutation({
    mutationFn: (n: Notice) => actor!.updateNotice(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice updated");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteNotice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice removed");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyNotice,
      noticeId: crypto.randomUUID(),
      publishedAt: BigInt(Date.now()) * BigInt(1_000_000),
      publishedBy: employeeId,
    });
    setModalOpen(true);
  }
  function openEdit(n: Notice) {
    setEditing(n);
    setForm({ ...n });
    setModalOpen(true);
  }
  function handleSubmit() {
    if (!form.title || !form.content) {
      toast.error("Fill all fields");
      return;
    }
    if (editing) updateMut.mutate(form);
    else publishMut.mutate(form);
  }

  const isPending = publishMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6" data-ocid="notices.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Official Notices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Memos, circulars, and policy updates
          </p>
        </div>
        {isAdmin && (
          <Button data-ocid="notices.add.primary_button" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Publish Notice
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {SKEL.map((k) => (
            <Skeleton key={k} className="h-28 w-full" />
          ))}
        </div>
      ) : notices && notices.length > 0 ? (
        <div className="space-y-4">
          {notices.map((n, i) => (
            <Card
              key={n.noticeId}
              data-ocid={`notices.item.${i + 1}`}
              className="shadow-card border-border"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${categoryColors[n.category]}`}
                      >
                        {n.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          Number(n.publishedAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{n.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {n.content}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        data-ocid={`notices.edit_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(n)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-ocid={`notices.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(n.noticeId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-3 py-16"
          data-ocid="notices.empty_state"
        >
          <Bell className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            No notices have been published yet.
          </p>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="notices.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Notice" : "Publish Notice"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                data-ocid="notices.input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Notice title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, category: v as NoticeCategory }))
                }
              >
                <SelectTrigger data-ocid="notices.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NoticeCategory.memo}>Memo</SelectItem>
                  <SelectItem value={NoticeCategory.circular}>
                    Circular
                  </SelectItem>
                  <SelectItem value={NoticeCategory.policy}>Policy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                data-ocid="notices.textarea"
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={5}
                placeholder="Notice content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="notices.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="notices.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="notices.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This notice will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="notices.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="notices.confirm_button"
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
