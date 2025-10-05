"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "./toast";
import { PlusIcon } from "./icons";

type File = {
    id: string;
    name: string;
    content: string;
    language: string;
};

type Message = {
    role: "user" | "assistant";
    content: string;
};

const SYNC_INTERVAL = 1000;
const CURSOR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

export function CollaborativeIDE({
    roomId,
    userId,
}: {
    roomId: string;
    userId: string;
}) {
    const [roomData, setRoomData] = useState<any>(null);
    const [files, setFiles] = useState<File[]>([
        {
            id: "1",
            name: "main.js",
            content: "// Start coding together!\nconsole.log('Hello, World!');\n",
            language: "javascript",
        },
    ]);
    const [activeFileId, setActiveFileId] = useState("1");
    const [output, setOutput] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [lastSync, setLastSync] = useState(0);
    const isLocalChange = useRef(false);

    const activeFile = files.find((f) => f.id === activeFileId);

    // Load room data
    useEffect(() => {
        fetch(`/api/rooms/${roomId}`)
            .then((res) => res.json())
            .then((data) => setRoomData(data))
            .catch((err) => console.error("Failed to load room:", err));
    }, [roomId]);

    // Real-time sync
    useEffect(() => {
        const syncInterval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/rooms/${roomId}/sync?lastSync=${lastSync}`
                );
                const data = await res.json();

                if (data.hasUpdates && !isLocalChange.current) {
                    if (data.code !== undefined) {
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === activeFileId ? { ...f, content: data.code } : f
                            )
                        );
                    }
                    setLastSync(data.timestamp);
                }
            } catch (error) {
                console.error("Sync error:", error);
            }
        }, SYNC_INTERVAL);

        return () => clearInterval(syncInterval);
    }, [roomId, lastSync, activeFileId]);

    const syncCode = async (code: string) => {
        try {
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
        } catch (error) {
            console.error("Failed to sync:", error);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined && activeFile) {
            isLocalChange.current = true;
            setFiles((prev) =>
                prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f))
            );
            syncCode(value);
            setTimeout(() => {
                isLocalChange.current = false;
            }, 100);
        }
    };

    const handleRunCode = async () => {
        if (!activeFile) return;

        setIsExecuting(true);
        setOutput("Executing...\n");

        try {
            const res = await fetch(`/api/rooms/${roomId}/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: activeFile.content,
                    language: activeFile.language,
                }),
            });

            const data = await res.json();

            if (data.error) {
                setOutput(`Error:\n${data.error}`);
            } else {
                setOutput(`Output:\n${data.output}`);
            }
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleAddFile = () => {
        const name = prompt("File name (e.g., script.py):");
        if (!name) return;

        const ext = name.split(".").pop() || "txt";
        const langMap: Record<string, string> = {
            js: "javascript",
            ts: "typescript",
            py: "python",
            html: "html",
            css: "css",
            json: "json",
            md: "markdown",
        };

        const newFile: File = {
            id: Date.now().toString(),
            name,
            content: "",
            language: langMap[ext] || "plaintext",
        };

        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        toast({ type: "success", description: `Created ${name}` });
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage: Message = { role: "user", content: chatInput };
        setMessages((prev) => [...prev, userMessage]);
        setChatInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: roomId,
                    message: {
                        id: Date.now().toString(),
                        role: "user",
                        parts: [{ type: "text", text: chatInput }],
                    },
                    selectedChatModel: "deepseek-coder",
                    selectedVisibilityType: "private",
                }),
            });

            // Handle streaming response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let aiResponse = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("0:")) {
                            try {
                                const data = JSON.parse(line.slice(2));
                                if (data.type === "text-delta" && data.textDelta) {
                                    aiResponse += data.textDelta;
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }

            if (aiResponse) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: aiResponse },
                ]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast({ type: "error", description: "Failed to send message" });
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <h1 className="font-semibold text-lg">
                        {roomData?.room?.name || "Loading..."}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {roomData?.participants?.length || 0} online
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        size="sm"
                        variant="outline"
                    >
                        {isChatOpen ? "Hide" : "Show"} AI Chat
                    </Button>
                    <Button
                        disabled={isExecuting}
                        onClick={handleRunCode}
                        size="sm"
                    >
                        {isExecuting ? "Running..." : "▶ Run"}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Files */}
                <div className="w-64 border-r bg-muted/30 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Files</h3>
                        <Button onClick={handleAddFile} size="sm" variant="ghost">
                            <PlusIcon />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {files.map((file) => (
                            <button
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-background ${file.id === activeFileId ? "bg-primary/10 font-medium" : ""
                                    }`}
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                type="button"
                            >
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
                                {file.name}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 font-semibold text-sm">Participants</h3>
                        <div className="space-y-2">
                            {roomData?.participants?.map((p: any, i: number) => (
                                <div
                                    className="flex items-center gap-2 text-sm"
                                    key={p.id}
                                >
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                            backgroundColor: CURSOR_COLORS[i % CURSOR_COLORS.length],
                                        }}
                                    />
                                    <span className="text-muted-foreground">
                                        {p.userId === userId ? "You" : `User ${i + 1}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor & Output */}
                <div className="flex flex-1 flex-col">
                    <div className="flex-1">
                        <Editor
                            language={activeFile?.language}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "on",
                            }}
                            theme="vs-dark"
                            value={activeFile?.content || ""}
                        />
                    </div>

                    {/* Output Terminal */}
                    <div className="h-48 border-t bg-black p-4 font-mono text-sm text-green-400">
                        <div className="mb-2 text-gray-400">Terminal Output:</div>
                        <pre className="whitespace-pre-wrap">{output || "Ready to execute code..."}</pre>
                    </div>
                </div>

                {/* AI Chat Sidebar */}
                {isChatOpen && (
                    <div className="flex w-96 flex-col border-l">
                        <div className="border-b p-4">
                            <h3 className="font-semibold">AI Assistant (DeepSeek Coder)</h3>
                            <p className="text-muted-foreground text-xs">
                                Ask questions about your code
                            </p>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            {messages.map((msg, i) => (
                                <div
                                    className={`rounded-lg p-3 ${msg.role === "user"
                                            ? "bg-primary/10 ml-8"
                                            : "bg-muted mr-8"
                                        }`}
                                    key={i}
                                >
                                    <div className="mb-1 font-semibold text-xs">
                                        {msg.role === "user" ? "You" : "AI"}
                                    </div>
                                    <div className="text-sm">{msg.content}</div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t p-4">
                            <div className="flex gap-2">
                                <Input
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSendMessage();
                                    }}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask AI about your code..."
                                    value={chatInput}
                                />
                                <Button onClick={handleSendMessage} size="sm">
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Live</span>
                    </span>
                    <span className="text-muted-foreground">{activeFile?.name}</span>
                </div>
                <div className="text-muted-foreground">
                    {activeFile?.language.toUpperCase()} • UTF-8
                </div>
            </div>
        </div>
    );
}
