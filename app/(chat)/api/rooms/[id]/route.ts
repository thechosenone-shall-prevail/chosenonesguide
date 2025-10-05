// GET /api/rooms/:id - Get room
// PUT /api/rooms/:id - Update room
// DELETE /api/rooms/:id - Delete room

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRoomManager } from "@/lib/rooms/room-manager";
import { z } from "zod";

const updateRoomSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  visibility: z.enum(["public", "private", "team"]).optional(),
  maxParticipants: z.number().min(2).max(50).optional(),
  password: z.string().optional(),
  currentTheme: z.string().optional(),
  isLocked: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const roomManager = getRoomManager();
    const room = await roomManager.getRoom(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check access
    const canAccess = await roomManager.canAccessRoom(id, session.user.id);

    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get participants
    const participants = await roomManager.getRoomParticipants(id);

    return NextResponse.json({
      room,
      participants,
    });
  } catch (error) {
    console.error("Get room API error:", error);
    return NextResponse.json(
      { error: "Failed to get room" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const validation = updateRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const roomManager = getRoomManager();
    const room = await roomManager.getRoom(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Only host can update room
    if (room.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await roomManager.updateRoom(id, validation.data);

    return NextResponse.json({
      success: true,
      room: updated,
    });
  } catch (error) {
    console.error("Update room API error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const roomManager = getRoomManager();
    const room = await roomManager.getRoom(id);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Only host can delete room
    if (room.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await roomManager.deleteRoom(id);

    return NextResponse.json({
      success: true,
      message: "Room deleted",
    });
  } catch (error) {
    console.error("Delete room API error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
