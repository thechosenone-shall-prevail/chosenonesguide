-- Create Room table
CREATE TABLE IF NOT EXISTS "Room" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "projectId" uuid,
  "creatorId" uuid NOT NULL REFERENCES "User"("id"),
  "teamId" uuid,
  "visibility" varchar DEFAULT 'private' NOT NULL,
  "maxParticipants" integer DEFAULT 10 NOT NULL,
  "currentTheme" varchar(100),
  "password" varchar(255),
  "isLocked" boolean DEFAULT false,
  "isArchived" boolean DEFAULT false,
  "sandboxId" varchar(255),
  "lastActivityAt" timestamp DEFAULT now() NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create RoomParticipant table
CREATE TABLE IF NOT EXISTS "RoomParticipant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "roomId" uuid NOT NULL REFERENCES "Room"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "role" varchar NOT NULL,
  "joinedAt" timestamp DEFAULT now() NOT NULL,
  "leftAt" timestamp,
  "isActive" boolean DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "room_creator_idx" ON "Room"("creatorId");
CREATE INDEX IF NOT EXISTS "room_visibility_idx" ON "Room"("visibility");
CREATE INDEX IF NOT EXISTS "room_activity_idx" ON "Room"("lastActivityAt");
CREATE INDEX IF NOT EXISTS "participant_room_idx" ON "RoomParticipant"("roomId");
CREATE INDEX IF NOT EXISTS "participant_user_idx" ON "RoomParticipant"("userId");
CREATE INDEX IF NOT EXISTS "participant_active_idx" ON "RoomParticipant"("isActive");
