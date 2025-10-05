"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor";
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

type CursorPosition = {
    userId: string;
    line: number;
    column: number;
};

const SYNC_INTERVAL = 1000; // Sync every 1 second
const CURSOR_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
];

export function CollaborativeRoomRealtime({
    roomId,
    userId,
}: {
    roomId: string;
    userId: string;
}) {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cursors, setCursors] = useState<CursorPosition[]>([]);
    const [lastSync, setLastSync] = useState(0);

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const decorationsRef = useRef<string[]>([]);
    const isLocalChange = useRef(false);

    // Load room data
    useEffect(() => {
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

    // Real-time sync - Pull updates
    useEffect(() => {
        const syncInterval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/rooms/${roomId}/sync?lastSync=${lastSync}`
                );
                const data = await res.json();

                if (data.hasUpdates) {
                    // Update code if changed remotely
                    if (data.code !== undefined && !isLocalChange.current) {
                        setCode(data.code);
                    }

                    // Update language
                    if (data.language && data.language !== language) {
                        setLanguage(data.language);
                    }

                    // Update cursors
                    if (data.cursors) {
                        setCursors(data.cursors.filter((c: CursorPosition) => c.userId !== userId));
                    }

                    setLastSync(data.timestamp);
                }
            } catch (error) {
                console.error("Sync error:", error);
            }
        }, SYNC_INTERVAL);

        return () => clearInterval(syncInterval);
    }, [roomId, lastSync, language, userId]);

    // Push code changes
    const syncCode = async (newCode: string) => {
        try {
            setIsSyncing(true);
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newCode }),
            });
        } catch (error) {
            console.error("Failed to sync code:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Push cursor position
    const syncCursor = async (line: number, column: number) => {
        try {
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cursor: { line, column } }),
            });
        } catch (error) {
            console.error("Failed to sync cursor:", error);
        }
    };

    // Handle editor mount
    const handleEditorDidMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco
    ) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            syncCursor(e.position.lineNumber, e.position.column);
        });
    };

    // Handle code changes
    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            isLocalChange.current = true;
            setCode(value);
            syncCode(value);
            setTimeout(() => {
                isLocalChange.current = false;
            }, 100);
        }
    };

    // Handle language change
    const handleLanguageChange = async (newLanguage: string) => {
        setLanguage(newLanguage);
        try {
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: newLanguage }),
            });
        } catch (error) {
            console.error("Failed to sync language:", error);
        }
    };

    // Render remote cursors
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;

        const editor = editorRef.current;
        const monaco = monacoRef.current;

        // Clear old decorations
        decorationsRef.current = editor.deltaDecorations(
            decorationsRef.current,
            []
        );

        // Add new cursor decorations
        const newDecorations = cursors.map((cursor, index) => {
            const color = CURSOR_COLORS[index % CURSOR_COLORS.length];
            return {
                range: new monaco.Range(
                    cursor.line,
                    cursor.column,
                    cursor.line,
                    cursor.column
                ),
                options: {
                    className: "remote-cursor",
                    glyphMarginClassName: "remote-cursor-glyph",
                    stickiness: 1,
                    beforeContentClassName: "remote-cursor-before",
                    afterContentClassName: "remote-cursor-after",
                    inlineClassName: `remote-cursor-inline`,
                    inlineClassNameAffectsLetterSpacing: true,
                },
            };
        });

        decorationsRef.current = editor.deltaDecorations([], newDecorations);
    }, [cursors]);

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
                        {isSyncing && (
                            <span className="ml-2 text-blue-500">• Syncing...</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        value={language}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
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
                        {roomData.participants.map((participant, index) => (
                            <div
                                className="flex items-center gap-2 rounded-md bg-background p-2"
                                key={participant.id}
                            >
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold"
                                    style={{
                                        backgroundColor:
                                            CURSOR_COLORS[index % CURSOR_COLORS.length],
                                    }}
                                >
                                    {participant.userId.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="truncate text-sm">
                                        {participant.userId === userId
                                            ? "You"
                                            : `User ${participant.userId.slice(0, 8)}`}
                                    </div>
                                    <div className="text-muted-foreground text-xs capitalize">
                                        {participant.role}
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 font-semibold text-sm">Files</h3>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2 py-1.5 text-sm">
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
                                main.
                                {language === "python"
                                    ? "py"
                                    : language === "typescript"
                                        ? "ts"
                                        : language === "html"
                                            ? "html"
                                            : language === "css"
                                                ? "css"
                                                : language === "json"
                                                    ? "json"
                                                    : language === "markdown"
                                                        ? "md"
                                                        : "js"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 font-semibold text-sm">Features</h3>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Real-time sync
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Live cursors
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                Auto-save
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
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: "on",
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
                        Room: {roomData.room.name}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Live</span>
                    </span>
                    {cursors.length > 0 && (
                        <span className="text-muted-foreground">
                            {cursors.length} other{cursors.length !== 1 ? "s" : ""} editing
                        </span>
                    )}
                </div>
                <div className="text-muted-foreground">
                    {language.charAt(0).toUpperCase() + language.slice(1)} • UTF-8 • LF
                </div>
            </div>

            <style jsx global>{`
        .remote-cursor {
          background-color: rgba(255, 107, 107, 0.3);
          border-left: 2px solid #ff6b6b;
        }
      `}</style>
        </div>
    );
}
