// POST /api/rooms/:id/join - Join room

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRoomManager } from "@/lib/rooms/room-manager";
import { z } from "zod";

const joinRoomSchema = z.object({
  password: z.string().optional(),
});

export async function POST(
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
    const validation = joinRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const roomManager = getRoomManager();
    const participant = await roomManager.joinRoom({
      roomId: id,
      userId: session.user.id,
      password: validation.data.password,
    });

    return NextResponse.json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("Join room API error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
