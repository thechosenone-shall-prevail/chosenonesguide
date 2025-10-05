"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";

type CreateRoomDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateRoomDialog({
  open,
  onClose,
  onSuccess,
}: CreateRoomDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private" as "public" | "private" | "team",
    maxParticipants: 10,
    password: "",
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          password: formData.password || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }

      toast.success("Room created successfully");
      setFormData({
        name: "",
        description: "",
        visibility: "private",
        maxParticipants: 10,
        password: "",
      });
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Collaborative Room</DialogTitle>
          <DialogDescription>
            Set up a new room for real-time collaborative coding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="My Awesome Project"
              value={formData.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What are you building?"
              rows={3}
              value={formData.description}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                onValueChange={(value: "public" | "private" | "team") =>
                  setFormData({ ...formData, visibility: value })
                }
                value={formData.visibility}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                max={50}
                min={2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxParticipants: Number.parseInt(e.target.value) || 10,
                  })
                }
                type="number"
                value={formData.maxParticipants}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Leave empty for no password"
              type="password"
              value={formData.password}
            />
            <p className="text-muted-foreground text-xs">
              Add a password to restrict access to this room
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={isCreating} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={handleCreate}>
            {isCreating ? "Creating..." : "Create Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
