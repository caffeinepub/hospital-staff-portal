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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Document as StaffDocument } from "../backend";
import { useAppContext } from "../context/AppContext";
import { useActor } from "../hooks/useActor";

const SKEL = ["s1", "s2", "s3"];
const SKEL_COLS5 = ["c1", "c2", "c3", "c4", "c5"];
const SKEL_COLS4 = ["c1", "c2", "c3", "c4"];

function QRCodeImage({ value }: { value: string }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`;
  return (
    <img src={url} alt="QR Code" width={150} height={150} className="rounded" />
  );
}

export default function DocumentVault() {
  const { actor, isFetching } = useActor();
  const { isAdmin, employeeId } = useAppContext();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<StaffDocument | null>(null);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<
    StaffDocument | null | "not-found"
  >(null);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", staffId: "" });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", employeeId, isAdmin],
    queryFn: () =>
      isAdmin
        ? (actor?.getAllDocuments() ?? Promise.resolve([]))
        : (actor?.getStaffDocuments(employeeId) ?? Promise.resolve([])),
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: (doc: StaffDocument) => actor!.createDocument(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document created");
      setModalOpen(false);
      setForm({ title: "", content: "", staffId: "" });
    },
    onError: () => toast.error("Failed to create document"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => actor!.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  function handleCreate() {
    if (!form.title || !form.content || !form.staffId) {
      toast.error("Fill all fields");
      return;
    }
    createMut.mutate({
      documentId: crypto.randomUUID(),
      verificationId: crypto.randomUUID(),
      title: form.title,
      content: form.content,
      staffId: form.staffId,
      issuedAt: BigInt(Date.now()) * BigInt(1_000_000),
      issuedBy: employeeId,
    });
  }

  async function handleVerify() {
    if (!verifyId.trim() || !actor) return;
    setVerifying(true);
    try {
      const result = await actor.verifyDocument(verifyId.trim());
      setVerifyResult(result ?? "not-found");
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="p-6 space-y-6" data-ocid="documents.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Generate and manage official documents"
              : "Your official documents"}
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="documents.add.primary_button"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Document
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 shadow-card">
        <p className="text-sm font-medium mb-3">Verify Document</p>
        <div className="flex gap-2">
          <Input
            data-ocid="documents.search_input"
            placeholder="Enter verification ID..."
            value={verifyId}
            onChange={(e) => {
              setVerifyId(e.target.value);
              setVerifyResult(null);
            }}
            className="flex-1"
          />
          <Button
            data-ocid="documents.verify.button"
            variant="outline"
            onClick={handleVerify}
            disabled={verifying || !verifyId}
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        {verifyResult && (
          <div className="mt-3">
            {verifyResult === "not-found" ? (
              <div
                className="flex items-center gap-2 text-destructive"
                data-ocid="documents.error_state"
              >
                <XCircle className="w-4 h-4" />
                <span className="text-sm">
                  Document not found or invalid verification ID.
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 text-green-600"
                data-ocid="documents.success_state"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  Verified: <strong>{verifyResult.title}</strong> — Issued to{" "}
                  {verifyResult.staffId}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Title</TableHead>
              {isAdmin && <TableHead>Staff ID</TableHead>}
              <TableHead>Issued Date</TableHead>
              <TableHead>Verification ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
            ) : docs && docs.length > 0 ? (
              docs.map((d, i) => (
                <TableRow
                  key={d.documentId}
                  data-ocid={`documents.item.${i + 1}`}
                >
                  <TableCell className="font-medium">{d.title}</TableCell>
                  {isAdmin && (
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.staffId}
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(
                      Number(d.issuedAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {d.verificationId.slice(0, 8)}...
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        data-ocid={`documents.qr.button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewDoc(d)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          data-ocid={`documents.delete_button.${i + 1}`}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(d.documentId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
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
                    data-ocid="documents.empty_state"
                  >
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      No documents found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-ocid="documents.dialog">
          <DialogHeader>
            <DialogTitle>Create Official Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Staff ID</Label>
              <Input
                data-ocid="documents.input"
                value={form.staffId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, staffId: e.target.value }))
                }
                placeholder="EMP-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Document Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Experience Certificate"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                data-ocid="documents.textarea"
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={5}
                placeholder="Document content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="documents.cancel_button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="documents.submit_button"
              onClick={handleCreate}
              disabled={createMut.isPending}
            >
              {createMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent data-ocid="documents.modal">
          <DialogHeader>
            <DialogTitle>Document QR Code</DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeImage value={viewDoc.verificationId} />
              <div className="text-center space-y-1">
                <p className="font-semibold">{viewDoc.title}</p>
                <p className="text-sm text-muted-foreground">
                  Staff: {viewDoc.staffId}
                </p>
                <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded break-all">
                  {viewDoc.verificationId}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="documents.close_button"
              onClick={() => setViewDoc(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This document will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="documents.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="documents.confirm_button"
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
