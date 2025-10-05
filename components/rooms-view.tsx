"use client";

import { motion } from "framer-motion";
import type { User } from "next-auth";
import { useState } from "react";
import useSWR from "swr";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import type { Room } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { PlusIcon } from "./icons";

type RoomsResponse = {
  rooms: (Room & { participantCount?: number })[];
};

export function RoomsView({ user }: { user: User }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data, isLoading, mutate } = useSWR<RoomsResponse>(
    "/api/rooms",
    fetcher
  );

  const rooms = data?.rooms || [];

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="font-semibold text-2xl">Collaborative Rooms</h1>
            <p className="text-muted-foreground text-sm">
              Code together in real-time
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon />
            <span className="ml-2">Create Room</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  className="h-48 animate-pulse rounded-lg bg-muted"
                  key={i}
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-lg">No rooms yet</h3>
              <p className="mb-6 max-w-sm text-muted-foreground text-sm">
                Create your first collaborative room to start coding with others
                in real-time.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon />
                <span className="ml-2">Create Your First Room</span>
              </Button>
            </div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
            >
              {rooms.map((room, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  key={room.id}
                  transition={{ delay: index * 0.05 }}
                >
                  <RoomCard room={room} userId={user.id ?? ""} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <CreateRoomDialog
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          mutate();
          setShowCreateDialog(false);
        }}
        open={showCreateDialog}
      />
    </div>
  );
}
