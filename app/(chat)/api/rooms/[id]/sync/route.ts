// Real-time sync endpoint for collaborative editing
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// In-memory store for room state (use Redis in production)
const roomStates = new Map<
  string,
  {
    code: string;
    language: string;
    cursors: Map<string, { line: number; column: number }>;
    lastUpdate: number;
  }
>();

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
    const { searchParams } = new URL(request.url);
    const lastSync = Number.parseInt(searchParams.get("lastSync") || "0");

    // Get or initialize room state
    if (!roomStates.has(id)) {
      roomStates.set(id, {
        code: "// Start coding together!\n\n",
        language: "javascript",
        cursors: new Map(),
        lastUpdate: Date.now(),
      });
    }

    const state = roomStates.get(id)!;

    // Only return updates if there are changes
    if (state.lastUpdate <= lastSync) {
      return NextResponse.json({
        hasUpdates: false,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      hasUpdates: true,
      code: state.code,
      language: state.language,
      cursors: Array.from(state.cursors.entries()).map(([userId, cursor]) => ({
        userId,
        ...cursor,
      })),
      timestamp: state.lastUpdate,
    });
  } catch (error) {
    console.error("Sync GET error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

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

    // Get or initialize room state
    if (!roomStates.has(id)) {
      roomStates.set(id, {
        code: "",
        language: "javascript",
        cursors: new Map(),
        lastUpdate: Date.now(),
      });
    }

    const state = roomStates.get(id)!;

    // Update code if provided
    if (body.code !== undefined) {
      state.code = body.code;
      state.lastUpdate = Date.now();
    }

    // Update language if provided
    if (body.language) {
      state.language = body.language;
      state.lastUpdate = Date.now();
    }

    // Update cursor position
    if (body.cursor) {
      state.cursors.set(session.user.id, body.cursor);
      state.lastUpdate = Date.now();
    }

    return NextResponse.json({
      success: true,
      timestamp: state.lastUpdate,
    });
  } catch (error) {
    console.error("Sync POST error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
