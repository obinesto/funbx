"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import authStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRMATION_TEXT = "DELETE";

export default function DeleteAccountDialog({
  requiresPassword = false,
  userEmail,
}) {
  const { deleteAccount } = authStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    confirmation === CONFIRMATION_TEXT &&
    (!requiresPassword || currentPassword.length > 0);

  const resetForm = () => {
    setCurrentPassword("");
    setConfirmation("");
  };

  const handleDelete = async (event) => {
    event.preventDefault();

    if (!canDelete) {
      toast.error("Complete the confirmation before deleting your account.");
      return;
    }

    setIsDeleting(true);

    try {
      const message = await deleteAccount({ currentPassword });
      toast.success(message);
      resetForm();
      setOpen(false);
      router.replace("/");
    } catch (error) {
      toast.error(error.message || "Unable to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleDelete}>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This permanently deletes all data associated with your FunBx account.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                You are deleting your account. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="grid gap-4 py-2">
            {requiresPassword ? (
              <div className="space-y-2">
                <Label htmlFor="deleteCurrentPassword">Current password</Label>
                <Input
                  id="deleteCurrentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="deleteConfirmation">
                Type <span className="font-bold">{CONFIRMATION_TEXT}</span> to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!canDelete || isDeleting}>
              {isDeleting ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
