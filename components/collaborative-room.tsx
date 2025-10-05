"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "./toast";

type Participant = {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
};

type RoomData = {
    room: {
        id: string;
        name: string;
        description?: string;
        currentTheme?: string;
    };
    participants: Participant[];
};

export function CollaborativeRoom({
    roomId,
    userId,
}: {
    roomId: string;
    userId: string;
}) {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [code, setCode] = useState("// Start coding together!\n\n");
    const [language, setLanguage] = useState("javascript");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch room data
        fetch(`/api/rooms/${roomId}`)
            .then((res) => res.json())
            .then((data) => {
                setRoomData(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load room:", err);
                toast({ type: "error", description: "Failed to load room" });
                setIsLoading(false);
            });
    }, [roomId]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
            // In a real implementation, this would sync to other users
        }
    };

    const handleRunCode = () => {
        toast({
            type: "success",
            description: "Code execution coming soon!",
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-dvh items-center justify-center">
                <div className="text-muted-foreground">Loading room...</div>
            </div>
        );
    }

    if (!roomData) {
        return (
            <div className="flex h-dvh items-center justify-center">
                <div className="text-muted-foreground">Room not found</div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <h1 className="font-semibold text-lg">{roomData.room.name}</h1>
                    <p className="text-muted-foreground text-sm">
                        {roomData.participants.length} participant
                        {roomData.participants.length !== 1 ? "s" : ""} online
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        onChange={(e) => setLanguage(e.target.value)}
                        value={language}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                    </select>
                    <Button onClick={handleRunCode} size="sm">
                        Run Code
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Participants */}
                <div className="w-64 border-r bg-muted/30 p-4">
                    <h3 className="mb-3 font-semibold text-sm">Participants</h3>
                    <div className="space-y-2">
                        {roomData.participants.map((participant) => (
                            <div
                                className="flex items-center gap-2 rounded-md bg-background p-2"
                                key={participant.id}
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                    {participant.userId.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="truncate text-sm">
                                        User {participant.userId.slice(0, 8)}
                                    </div>
                                    <div className="text-muted-foreground text-xs capitalize">
                                        {participant.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 font-semibold text-sm">Files</h3>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                    />
                                </svg>
                                main.{language === "python" ? "py" : "js"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1">
                    <Editor
                        defaultLanguage={language}
                        language={language}
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                        }}
                        theme="vs-dark"
                        value={code}
                    />
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                        Room ID: {roomId.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Connected</span>
                    </span>
                </div>
                <div className="text-muted-foreground">
                    {language.charAt(0).toUpperCase() + language.slice(1)} • UTF-8 • LF
                </div>
            </div>
        </div>
    );
}
