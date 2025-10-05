// POST /api/rooms/:id/leave - Leave room

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getRoomManager } from "@/lib/rooms/room-manager";

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

    const roomManager = getRoomManager();
    await roomManager.leaveRoom(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Left room",
    });
  } catch (error) {
    console.error("Leave room API error:", error);
    return NextResponse.json(
      { error: "Failed to leave room" },
      { status: 500 }
    );
  }
}
