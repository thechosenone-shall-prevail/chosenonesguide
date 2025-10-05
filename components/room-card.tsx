"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Room } from "@/lib/db/schema";

type RoomCardProps = {
  room: Room & { participantCount?: number };
  userId: string;
};

export function RoomCard({ room, userId }: RoomCardProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const isCreator = room.creatorId === userId;
  const participantCount = room.participantCount || 0;

  const handleJoin = async () => {
    if (room.password && !showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join room");
      }

      router.push(`/rooms/${room.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join room"
      );
      setIsJoining(false);
    }
  };

  const getVisibilityBadge = () => {
    const badges = {
      public: (
        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 font-medium text-green-600 text-xs dark:text-green-400">
          Public
        </span>
      ),
      private: (
        <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 font-medium text-zinc-600 text-xs dark:text-zinc-400">
          Private
        </span>
      ),
      team: (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 font-medium text-blue-600 text-xs dark:text-blue-400">
          Team
        </span>
      ),
    };
    return badges[room.visibility as keyof typeof badges];
  };

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{room.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {room.description || "No description"}
            </CardDescription>
          </div>
          {getVisibilityBadge()}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <span>
              {participantCount} / {room.maxParticipants} participants
            </span>
          </div>

          {room.currentTheme && (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span className="capitalize">
                {room.currentTheme.replace(/-/g, " ")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            <span>
              Active {formatDistanceToNow(new Date(room.lastActivityAt))} ago
            </span>
          </div>

          {room.password && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <span>Password protected</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {showPasswordInput && (
          <Input
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="Enter room password"
            type="password"
            value={password}
          />
        )}
        <Button
          className="w-full"
          disabled={isJoining || participantCount >= room.maxParticipants}
          onClick={handleJoin}
          variant={isCreator ? "default" : "secondary"}
        >
          {isJoining
            ? "Joining..."
            : isCreator
              ? "Enter Room"
              : participantCount >= room.maxParticipants
                ? "Room Full"
                : "Join Room"}
        </Button>
      </CardFooter>
    </Card>
  );
}
