// Room Management Service

import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { room, roomParticipant } from "@/lib/db/schema";
import type {
  CreateRoomParams,
  JoinRoomParams,
  ParticipantRole,
  Room,
  RoomParticipant,
} from "./types";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export class RoomManager {
  /**
   * Create a new room
   */
  async createRoom(params: CreateRoomParams, creatorId: string): Promise<Room> {
    try {
      // Hash password if provided
      let hashedPassword: string | undefined;
      if (params.password) {
        hashedPassword = this.hashPassword(params.password);
      }

      const [newRoom] = await db
        .insert(room)
        .values({
          name: params.name,
          description: params.description,
          projectId: params.projectId,
          creatorId,
          teamId: params.teamId,
          visibility: params.visibility,
          maxParticipants: params.maxParticipants || 10,
          currentTheme: params.currentTheme,
          password: hashedPassword,
          isLocked: false,
          isArchived: false,
          lastActivityAt: new Date(),
        })
        .returning();

      // Add creator as host
      await db.insert(roomParticipant).values({
        roomId: newRoom.id,
        userId: creatorId,
        role: "host",
        isActive: true,
      });

      return this.mapToRoom(newRoom);
    } catch (error) {
      console.error("Create room error:", error);
      throw new Error("Failed to create room");
    }
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const [roomData] = await db
        .select()
        .from(room)
        .where(eq(room.id, roomId))
        .limit(1);

      if (!roomData) {
        return null;
      }

      return this.mapToRoom(roomData);
    } catch (error) {
      console.error("Get room error:", error);
      return null;
    }
  }

  /**
   * Update room
   */
  async updateRoom(
    roomId: string,
    updates: Partial<CreateRoomParams>
  ): Promise<Room> {
    try {
      const updateData: any = {
        ...updates,
        lastActivityAt: new Date(),
      };

      // Hash password if being updated
      if (updates.password) {
        updateData.password = this.hashPassword(updates.password);
      }

      const [updated] = await db
        .update(room)
        .set(updateData)
        .where(eq(room.id, roomId))
        .returning();

      return this.mapToRoom(updated);
    } catch (error) {
      console.error("Update room error:", error);
      throw new Error("Failed to update room");
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomId: string): Promise<void> {
    try {
      // Archive instead of delete
      await db
        .update(room)
        .set({ isArchived: true })
        .where(eq(room.id, roomId));
    } catch (error) {
      console.error("Delete room error:", error);
      throw new Error("Failed to delete room");
    }
  }

  /**
   * Join a room
   */
  async joinRoom(params: JoinRoomParams): Promise<RoomParticipant> {
    try {
      const roomData = await this.getRoom(params.roomId);

      if (!roomData) {
        throw new Error("Room not found");
      }

      // Check if room is locked
      if (roomData.isLocked) {
        throw new Error("Room is locked");
      }

      // Check password if required
      if (roomData.password && params.password) {
        const isValid = this.verifyPassword(params.password, roomData.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }
      } else if (roomData.password && !params.password) {
        throw new Error("Password required");
      }

      // Check participant limit
      const currentParticipants = await this.getRoomParticipants(params.roomId);
      if (currentParticipants.length >= roomData.maxParticipants) {
        throw new Error("Room is full");
      }

      // Check if already a participant
      const existing = currentParticipants.find(
        (p) => p.userId === params.userId && p.isActive
      );

      if (existing) {
        return existing;
      }

      // Add as participant
      const [participant] = await db
        .insert(roomParticipant)
        .values({
          roomId: params.roomId,
          userId: params.userId,
          role: "participant",
          isActive: true,
        })
        .returning();

      // Update room activity
      await db
        .update(room)
        .set({ lastActivityAt: new Date() })
        .where(eq(room.id, params.roomId));

      return this.mapToParticipant(participant);
    } catch (error) {
      console.error("Join room error:", error);
      throw error;
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      await db
        .update(roomParticipant)
        .set({
          isActive: false,
          leftAt: new Date(),
        })
        .where(
          and(
            eq(roomParticipant.roomId, roomId),
            eq(roomParticipant.userId, userId)
          )
        );
    } catch (error) {
      console.error("Leave room error:", error);
      throw new Error("Failed to leave room");
    }
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    try {
      const participants = await db
        .select()
        .from(roomParticipant)
        .where(
          and(
            eq(roomParticipant.roomId, roomId),
            eq(roomParticipant.isActive, true)
          )
        );

      return participants.map((p: typeof roomParticipant.$inferSelect) =>
        this.mapToParticipant(p)
      );
    } catch (error) {
      console.error("Get participants error:", error);
      return [];
    }
  }

  /**
   * Update participant role
   */
  async updateParticipantRole(
    roomId: string,
    userId: string,
    role: ParticipantRole
  ): Promise<void> {
    try {
      await db
        .update(roomParticipant)
        .set({ role })
        .where(
          and(
            eq(roomParticipant.roomId, roomId),
            eq(roomParticipant.userId, userId)
          )
        );
    } catch (error) {
      console.error("Update participant role error:", error);
      throw new Error("Failed to update participant role");
    }
  }

  /**
   * Check if user can access room
   */
  async canAccessRoom(
    roomId: string,
    userId: string,
    teamId?: string
  ): Promise<boolean> {
    try {
      const roomData = await this.getRoom(roomId);

      if (!roomData) {
        return false;
      }

      // Creator always has access
      if (roomData.creatorId === userId) {
        return true;
      }

      // Check visibility
      if (roomData.visibility === "public") {
        return true;
      }

      if (roomData.visibility === "team" && roomData.teamId === teamId) {
        return true;
      }

      // Check if already a participant
      const participants = await this.getRoomParticipants(roomId);
      return participants.some((p) => p.userId === userId);
    } catch (error) {
      console.error("Can access room error:", error);
      return false;
    }
  }

  /**
   * Get user's rooms
   */
  async getUserRooms(userId: string): Promise<Room[]> {
    try {
      const participants = await db
        .select()
        .from(roomParticipant)
        .where(
          and(
            eq(roomParticipant.userId, userId),
            eq(roomParticipant.isActive, true)
          )
        );

      const roomIds = participants.map(
        (p: typeof roomParticipant.$inferSelect) => p.roomId
      );
      const rooms: Room[] = [];

      for (const roomId of roomIds) {
        const roomData = await this.getRoom(roomId);
        if (roomData && !roomData.isArchived) {
          rooms.push(roomData);
        }
      }

      return rooms;
    } catch (error) {
      console.error("Get user rooms error:", error);
      return [];
    }
  }

  // Private helper methods

  private hashPassword(password: string): string {
    // Simple hash for demo - use bcrypt in production
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  private verifyPassword(password: string, hash: string): boolean {
    const inputHash = this.hashPassword(password);
    return inputHash === hash;
  }

  private mapToRoom(data: any): Room {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      creatorId: data.creatorId,
      teamId: data.teamId,
      visibility: data.visibility,
      maxParticipants: data.maxParticipants,
      currentTheme: data.currentTheme,
      password: data.password,
      isLocked: data.isLocked,
      isArchived: data.isArchived,
      sandboxId: data.sandboxId,
      lastActivityAt: data.lastActivityAt,
      createdAt: data.createdAt,
    };
  }

  private mapToParticipant(data: any): RoomParticipant {
    return {
      id: data.id,
      roomId: data.roomId,
      userId: data.userId,
      role: data.role,
      joinedAt: data.joinedAt,
      leftAt: data.leftAt,
      isActive: data.isActive,
    };
  }
}

// Singleton instance
let roomManagerInstance: RoomManager | null = null;

export function getRoomManager(): RoomManager {
  if (!roomManagerInstance) {
    roomManagerInstance = new RoomManager();
  }
  return roomManagerInstance;
}
