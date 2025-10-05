// Socket.io Server for Real-Time Collaboration

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type {
  CodeChange,
  FileOperation,
  CursorPosition,
  RoomMessage,
} from "@/lib/rooms/types";
import { getRoomManager } from "@/lib/rooms/room-manager";

export interface SocketEvents {
  // Connection events
  "room:join": (data: { roomId: string; userId: string }) => void;
  "room:leave": (data: { roomId: string }) => void;

  // Code synchronization
  "code:change": (data: CodeChange) => void;
  "code:sync": (data: { fileId: string; content: string }) => void;

  // File operations
  "file:create": (data: FileOperation) => void;
  "file:delete": (data: FileOperation) => void;
  "file:rename": (data: FileOperation) => void;

  // Cursor tracking
  "cursor:move": (data: { userId: string; cursor: CursorPosition }) => void;

  // Chat
  "message:send": (data: RoomMessage) => void;

  // Execution
  "code:execute": (data: { command: string; args?: string[] }) => void;
  "code:output": (data: { output: string; error?: string }) => void;

  // Theme
  "theme:change": (data: { theme: string }) => void;
}

export class SocketServer {
  private io: SocketIOServer | null = null;
  private roomManager = getRoomManager();

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
    });

    this.setupEventHandlers();
    console.log("Socket.io server initialized");
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Room events
      socket.on("room:join", async (data) => {
        await this.handleRoomJoin(socket, data);
      });

      socket.on("room:leave", (data) => {
        this.handleRoomLeave(socket, data);
      });

      // Code synchronization
      socket.on("code:change", (data) => {
        this.handleCodeChange(socket, data);
      });

      socket.on("code:sync", (data) => {
        this.handleCodeSync(socket, data);
      });

      // File operations
      socket.on("file:create", (data) => {
        this.handleFileOperation(socket, data, "create");
      });

      socket.on("file:delete", (data) => {
        this.handleFileOperation(socket, data, "delete");
      });

      socket.on("file:rename", (data) => {
        this.handleFileOperation(socket, data, "rename");
      });

      // Cursor tracking
      socket.on("cursor:move", (data) => {
        this.handleCursorMove(socket, data);
      });

      // Chat
      socket.on("message:send", (data) => {
        this.handleMessage(socket, data);
      });

      // Code execution
      socket.on("code:execute", (data) => {
        this.handleCodeExecute(socket, data);
      });

      // Theme
      socket.on("theme:change", (data) => {
        this.handleThemeChange(socket, data);
      });

      // Disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  // Event handlers

  private async handleRoomJoin(
    socket: any,
    data: { roomId: string; userId: string }
  ): Promise<void> {
    try {
      // Verify user can access room
      const canAccess = await this.roomManager.canAccessRoom(
        data.roomId,
        data.userId
      );

      if (!canAccess) {
        socket.emit("error", { message: "Access denied" });
        return;
      }

      // Join room
      socket.join(data.roomId);

      // Get room participants
      const participants = await this.roomManager.getRoomParticipants(
        data.roomId
      );

      // Notify others
      socket.to(data.roomId).emit("participant:joined", {
        userId: data.userId,
        socketId: socket.id,
      });

      // Send current participants to new user
      socket.emit("room:participants", { participants });

      console.log(`User ${data.userId} joined room ${data.roomId}`);
    } catch (error) {
      console.error("Room join error:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  }

  private handleRoomLeave(socket: any, data: { roomId: string }): void {
    socket.leave(data.roomId);
    socket.to(data.roomId).emit("participant:left", {
      socketId: socket.id,
    });
    console.log(`User left room ${data.roomId}`);
  }

  private handleCodeChange(socket: any, data: CodeChange): void {
    // Broadcast to all other users in the room
    socket.to(data.roomId).emit("code:changed", data);
  }

  private handleCodeSync(
    socket: any,
    data: { fileId: string; content: string }
  ): void {
    // Broadcast full file sync
    socket.broadcast.emit("code:synced", data);
  }

  private handleFileOperation(
    socket: any,
    data: FileOperation,
    type: string
  ): void {
    // Broadcast file operation to room
    const roomId = (socket as any).roomId;
    if (roomId) {
      socket.to(roomId).emit(`file:${type}d`, data);
    }
  }

  private handleCursorMove(
    socket: any,
    data: { userId: string; cursor: CursorPosition }
  ): void {
    // Broadcast cursor position
    socket.broadcast.emit("cursor:moved", {
      ...data,
      socketId: socket.id,
    });
  }

  private handleMessage(socket: any, data: RoomMessage): void {
    // Broadcast message to room
    socket.to(data.roomId).emit("message:received", data);
  }

  private handleCodeExecute(
    socket: any,
    data: { command: string; args?: string[] }
  ): void {
    // This would integrate with sandbox manager
    // For now, just acknowledge
    socket.emit("code:executing", { command: data.command });
  }

  private handleThemeChange(socket: any, data: { theme: string }): void {
    // Broadcast theme change to room
    const roomId = (socket as any).roomId;
    if (roomId) {
      socket.to(roomId).emit("theme:changed", data);
    }
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Emit to a specific room
   */
  emitToRoom(roomId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  /**
   * Get room participants count
   */
  async getRoomParticipantsCount(roomId: string): Promise<number> {
    if (!this.io) return 0;

    const sockets = await this.io.in(roomId).fetchSockets();
    return sockets.length;
  }
}

// Singleton instance
let socketServerInstance: SocketServer | null = null;

export function getSocketServer(): SocketServer {
  if (!socketServerInstance) {
    socketServerInstance = new SocketServer();
  }
  return socketServerInstance;
}
