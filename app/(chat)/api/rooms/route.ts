// POST /api/rooms - Create room
// GET /api/rooms - Get user's rooms

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRoomManager } from "@/lib/rooms/room-manager";
import { z } from "zod";

const createRoomSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  visibility: z.enum(["public", "private", "team"]),
  maxParticipants: z.number().min(2).max(50).optional(),
  password: z.string().optional(),
  currentTheme: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const roomManager = getRoomManager();
    const room = await roomManager.createRoom(
      validation.data,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Create room API error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomManager = getRoomManager();
    const rooms = await roomManager.getUserRooms(session.user.id);

    return NextResponse.json({
      rooms,
    });
  } catch (error) {
    console.error("Get rooms API error:", error);
    return NextResponse.json(
      { error: "Failed to get rooms" },
      { status: 500 }
    );
  }
}
