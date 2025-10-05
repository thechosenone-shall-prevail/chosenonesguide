// Room Types

export type RoomVisibility = "public" | "private" | "team";
export type ParticipantRole = "host" | "moderator" | "participant";

export type Room = {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  creatorId: string;
  teamId?: string;
  visibility: RoomVisibility;
  maxParticipants: number;
  currentTheme?: string;
  password?: string;
  isLocked: boolean;
  isArchived: boolean;
  sandboxId?: string;
  lastActivityAt: Date;
  createdAt: Date;
};

export type RoomParticipant = {
  id: string;
  roomId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  socketId?: string;
  cursor?: CursorPosition;
  color?: string;
};

export type CursorPosition = {
  line: number;
  column: number;
  file?: string;
};

export type RoomSession = {
  roomId: string;
  userId: string;
  socketId: string;
  joinedAt: Date;
  role: ParticipantRole;
  cursor?: CursorPosition;
};

export type CreateRoomParams = {
  name: string;
  description?: string;
  projectId?: string;
  teamId?: string;
  visibility: RoomVisibility;
  maxParticipants?: number;
  password?: string;
  currentTheme?: string;
};

export type JoinRoomParams = {
  roomId: string;
  userId: string;
  password?: string;
};

export type RoomInvitation = {
  id: string;
  roomId: string;
  invitedBy: string;
  invitedEmail: string;
  expiresAt: Date;
  createdAt: Date;
};

export type RoomMessage = {
  id: string;
  roomId: string;
  userId: string;
  agentId?: string;
  content: string;
  type:
    | "chat"
    | "system"
    | "ai-response"
    | "agent-communication"
    | "code-suggestion";
  createdAt: Date;
};

export type CodeChange = {
  id: string;
  roomId: string;
  userId: string;
  fileId: string;
  changes: TextChange[];
  timestamp: number;
};

export type TextChange = {
  range: Range;
  text: string;
  rangeLength: number;
};

export type Range = {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type FileOperation = {
  type: "create" | "delete" | "rename" | "move";
  path: string;
  newPath?: string;
  content?: string;
  userId: string;
  timestamp: number;
};
