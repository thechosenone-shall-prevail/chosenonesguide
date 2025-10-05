"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "./toast";

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

const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        html: "html",
        css: "css",
        json: "json",
        md: "markdown",
    };
    return map[ext] || "plaintext";
};

export function CompleteIDE({
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
            name: "index.js",
            content:
                "// Welcome! Start coding\nconsole.log('Hello, World!');\n\nconst sum = (a, b) => a + b;\nconsole.log('2 + 3 =', sum(2, 3));\n",
            language: "javascript",
        },
    ]);
    const [activeFileId, setActiveFileId] = useState("1");
    const [output, setOutput] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [lastSync, setLastSync] = useState(0);
    const isLocalChange = useRef(false);
    const newFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const activeFile = files.find((f) => f.id === activeFileId);

    useEffect(() => {
        fetch(`/api/rooms/${roomId}`)
            .then((res) => res.json())
            .then((data) => setRoomData(data))
            .catch(() => { });
    }, [roomId]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/rooms/${roomId}/sync?lastSync=${lastSync}`
                );
                const data = await res.json();
                if (data.hasUpdates && !isLocalChange.current && data.code) {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.id === activeFileId ? { ...f, content: data.code } : f
                        )
                    );
                    setLastSync(data.timestamp);
                }
            } catch { }
        }, SYNC_INTERVAL);
        return () => clearInterval(interval);
    }, [roomId, lastSync, activeFileId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const syncCode = async (code: string) => {
        try {
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
        } catch { }
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

    const handleRun = async () => {
        if (!activeFile) return;
        setIsExecuting(true);
        setOutput("⚡ Executing...\n");

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
            setOutput(
                data.error ? `❌ Error:\n${data.error}` : `✓ Output:\n${data.output}`
            );
        } catch (error) {
            setOutput(`❌ Error: ${error}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const startCreatingFile = () => {
        setIsCreatingFile(true);
        setNewFileName("");
        setTimeout(() => newFileInputRef.current?.focus(), 0);
    };

    const createFile = () => {
        const name = newFileName.trim();
        if (!name) {
            setIsCreatingFile(false);
            return;
        }

        const newFile: File = {
            id: Date.now().toString(),
            name,
            content: `// ${name}\n\n`,
            language: getLanguageFromFilename(name),
        };

        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setIsCreatingFile(false);
        setNewFileName("");
        toast({ type: "success", description: `Created ${name}` });
    };

    const deleteFile = (fileId: string) => {
        if (files.length === 1) {
            toast({ type: "error", description: "Cannot delete the last file" });
            return;
        }
        const file = files.find((f) => f.id === fileId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        if (activeFileId === fileId) {
            setActiveFileId(files[0].id);
        }
        toast({ type: "success", description: `Deleted ${file?.name}` });
    };

    const sendMessage = async () => {
        if (!chatInput.trim() || isSending) return;

        const userMsg: Message = { role: "user", content: chatInput };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setIsSending(true);

        try {
            const context = `Current file: ${activeFile?.name}\nCode:\n${activeFile?.content}\n\nUser question: ${chatInput}`;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: `room-${roomId}-${Date.now()}`,
                    message: {
                        id: Date.now().toString(),
                        role: "user",
                        parts: [{ type: "text", text: context }],
                    },
                    selectedChatModel: "deepseek-coder",
                    selectedVisibilityType: "private",
                }),
            });

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
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        if (
                                            newMsgs[newMsgs.length - 1]?.role === "assistant"
                                        ) {
                                            newMsgs[newMsgs.length - 1].content = aiResponse;
                                        } else {
                                            newMsgs.push({ role: "assistant", content: aiResponse });
                                        }
                                        return newMsgs;
                                    });
                                }
                            } catch { }
                        }
                    }
                }
            }
        } catch (error) {
            toast({ type: "error", description: "Failed to send message" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background">
            {/* Title Bar */}
            <div className="flex h-12 items-center justify-between border-b bg-sidebar px-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <svg
                            className="h-5 w-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                        <span className="font-semibold text-sm">
                            {roomData?.room?.name || "Collaborative IDE"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        {roomData?.participants?.length || 0} online
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowChat(!showChat)}
                        size="sm"
                        variant="outline"
                    >
                        {showChat ? "Hide" : "Show"} AI Chat
                    </Button>
                    <Button disabled={isExecuting} onClick={handleRun} size="sm">
                        {isExecuting ? "Running..." : "▶ Run"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-56 border-r bg-sidebar">
                    <div className="flex h-9 items-center justify-between border-b px-3">
                        <span className="font-medium text-xs uppercase tracking-wide text-sidebar-foreground">
                            Explorer
                        </span>
                        <button
                            className="rounded p-1 hover:bg-sidebar-accent"
                            onClick={startCreatingFile}
                            title="New File"
                            type="button"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 4v16m8-8H4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="p-2">
                        {isCreatingFile && (
                            <div className="mb-1">
                                <Input
                                    ref={newFileInputRef}
                                    className="h-7 text-xs"
                                    onBlur={() => {
                                        if (!newFileName.trim()) setIsCreatingFile(false);
                                    }}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") createFile();
                                        if (e.key === "Escape") {
                                            setIsCreatingFile(false);
                                            setNewFileName("");
                                        }
                                    }}
                                    placeholder="filename.js"
                                    value={newFileName}
                                />
                            </div>
                        )}

                        {files.map((file) => (
                            <div
                                className={`group flex items-center justify-between rounded-sm px-2 py-1 text-sm transition-colors ${file.id === activeFileId
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    }`}
                                key={file.id}
                            >
                                <button
                                    className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                                    onClick={() => setActiveFileId(file.id)}
                                    type="button"
                                >
                                    <svg
                                        className="h-4 w-4 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                        />
                                    </svg>
                                    <span className="truncate">{file.name}</span>
                                </button>
                                {files.length > 1 && (
                                    <button
                                        className="ml-1 flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFile(file.id);
                                        }}
                                        title="Delete"
                                        type="button"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M6 18L18 6M6 6l12 12"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t p-2">
                        <div className="mb-2 px-2 font-medium text-xs uppercase tracking-wide text-sidebar-foreground">
                            Participants
                        </div>
                        <div className="space-y-1">
                            {roomData?.participants?.map((p: any, i: number) => (
                                <div
                                    className="flex items-center gap-2 px-2 py-1 text-xs text-sidebar-foreground"
                                    key={p.id}
                                >
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span>{p.userId === userId ? "You" : `User ${i + 1}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex flex-1">
                    <div className="flex flex-1 flex-col">
                        {/* Tabs */}
                        <div className="flex h-9 items-center gap-px border-b bg-muted/30">
                            {files.map((file) => (
                                <button
                                    className={`flex items-center gap-2 border-r px-3 py-2 text-sm transition-colors ${file.id === activeFileId
                                            ? "bg-background"
                                            : "bg-muted/50 hover:bg-muted"
                                        }`}
                                    key={file.id}
                                    onClick={() => setActiveFileId(file.id)}
                                    type="button"
                                >
                                    <span>{file.name}</span>
                                    {file.id === activeFileId && files.length > 1 && (
                                        <button
                                            className="rounded hover:bg-muted"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteFile(file.id);
                                            }}
                                            type="button"
                                        >
                                            <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M6 18L18 6M6 6l12 12"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Editor */}
                        <div className="flex-1">
                            <Editor
                                language={activeFile?.language}
                                onChange={handleEditorChange}
                                options={{
                                    minimap: { enabled: true },
                                    fontSize: 14,
                                    lineNumbers: "on",
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: "on",
                                    scrollBeyondLastLine: false,
                                }}
                                theme="vs-dark"
                                value={activeFile?.content || ""}
                            />
                        </div>

                        {/* Terminal */}
                        <div className="h-48 border-t bg-[#1e1e1e]">
                            <div className="flex h-8 items-center justify-between border-b border-[#2d2d2d] px-3">
                                <span className="font-medium text-xs text-gray-300">
                                    TERMINAL
                                </span>
                                <button
                                    className="rounded p-1 text-gray-400 hover:bg-[#2d2d2d] hover:text-white"
                                    onClick={() => setOutput("")}
                                    title="Clear"
                                    type="button"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="h-[calc(100%-2rem)] overflow-y-auto p-3 font-mono text-sm">
                                <pre className="text-green-400 whitespace-pre-wrap">
                                    {output || "$ Ready. Click 'Run' to execute code."}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* AI Chat Panel */}
                    {showChat && (
                        <div className="flex w-96 flex-col border-l bg-background">
                            <div className="border-b p-3">
                                <h3 className="font-semibold text-sm">AI Assistant</h3>
                                <p className="text-muted-foreground text-xs">
                                    Ask about your code
                                </p>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                                {messages.map((msg, i) => (
                                    <div
                                        className={`rounded-lg p-3 text-sm ${msg.role === "user"
                                                ? "bg-primary/10 ml-8"
                                                : "bg-muted mr-8"
                                            }`}
                                        key={i}
                                    >
                                        <div className="mb-1 font-semibold text-xs">
                                            {msg.role === "user" ? "You" : "AI"}
                                        </div>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="border-t p-3">
                                <Textarea
                                    className="mb-2 min-h-[60px] text-sm"
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask AI about your code..."
                                    value={chatInput}
                                />
                                <Button
                                    className="w-full"
                                    disabled={isSending || !chatInput.trim()}
                                    onClick={sendMessage}
                                    size="sm"
                                >
                                    {isSending ? "Sending..." : "Send"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex h-6 items-center justify-between bg-primary px-3 text-primary-foreground text-xs">
                <div className="flex items-center gap-3">
                    <span>🔌 Live</span>
                    <span>{activeFile?.language.toUpperCase()}</span>
                    <span>{activeFile?.name}</span>
                </div>
                <span>Room: {roomData?.room?.name}</span>
            </div>
        </div>
    );
}
