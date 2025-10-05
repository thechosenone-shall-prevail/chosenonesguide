"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "./toast";

type File = {
    id: string;
    name: string;
    content: string;
    language: string;
};

const SYNC_INTERVAL = 1000;

export function CollaborativeIDEPro({
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
            content: "// Welcome to the collaborative IDE!\n// Start coding together\n\nconsole.log('Hello, World!');\n",
            language: "javascript",
        },
    ]);
    const [activeFileId, setActiveFileId] = useState("1");
    const [output, setOutput] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [showNewFile, setShowNewFile] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        fileId: string;
    } | null>(null);
    const [lastSync, setLastSync] = useState(0);
    const isLocalChange = useRef(false);

    const activeFile = files.find((f) => f.id === activeFileId);

    // Load room
    useEffect(() => {
        fetch(`/api/rooms/${roomId}`)
            .then((res) => res.json())
            .then((data) => setRoomData(data))
            .catch((err) => console.error(err));
    }, [roomId]);

    // Real-time sync
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
            } catch (e) { }
        }, SYNC_INTERVAL);
        return () => clearInterval(interval);
    }, [roomId, lastSync, activeFileId]);

    const syncCode = async (code: string) => {
        try {
            await fetch(`/api/rooms/${roomId}/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
        } catch (e) { }
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
            setOutput(data.error ? `Error:\n${data.error}` : `${data.output}`);
        } catch (error) {
            setOutput(`Error: ${error}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const createFile = () => {
        if (!newFileName.trim()) return;

        const ext = newFileName.split(".").pop() || "txt";
        const langMap: Record<string, string> = {
            js: "javascript",
            ts: "typescript",
            py: "python",
            html: "html",
            css: "css",
            json: "json",
            md: "markdown",
            jsx: "javascript",
            tsx: "typescript",
        };

        const newFile: File = {
            id: Date.now().toString(),
            name: newFileName,
            content: "",
            language: langMap[ext] || "plaintext",
        };

        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setNewFileName("");
        setShowNewFile(false);
        toast({ type: "success", description: `Created ${newFileName}` });
    };

    const deleteFile = (fileId: string) => {
        if (files.length === 1) {
            toast({ type: "error", description: "Cannot delete the last file" });
            return;
        }
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        if (activeFileId === fileId) {
            setActiveFileId(files[0].id);
        }
        toast({ type: "success", description: "File deleted" });
    };

    const renameFile = (fileId: string) => {
        const file = files.find((f) => f.id === fileId);
        if (!file) return;

        const newName = prompt("New file name:", file.name);
        if (!newName) return;

        setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
        );
        toast({ type: "success", description: "File renamed" });
    };

    return (
        <div className="flex h-dvh flex-col bg-background">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-4">
                    <h1 className="font-semibold text-sm">
                        {roomData?.room?.name || "Collaborative IDE"}
                    </h1>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        {roomData?.participants?.length || 0} online
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        disabled={isExecuting}
                        onClick={handleRun}
                        size="sm"
                        variant="default"
                    >
                        {isExecuting ? "Running..." : "▶ Run Code"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - File Explorer */}
                <div className="w-64 border-r bg-muted/20">
                    <div className="border-b p-2">
                        <div className="mb-2 flex items-center justify-between px-2">
                            <span className="font-semibold text-xs uppercase text-muted-foreground">
                                Explorer
                            </span>
                            <button
                                className="rounded p-1 hover:bg-muted"
                                onClick={() => setShowNewFile(true)}
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
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                    />
                                </svg>
                            </button>
                        </div>

                        {showNewFile && (
                            <div className="mb-2 flex gap-1 px-2">
                                <Input
                                    autoFocus
                                    className="h-7 text-xs"
                                    onBlur={() => setShowNewFile(false)}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") createFile();
                                        if (e.key === "Escape") setShowNewFile(false);
                                    }}
                                    placeholder="filename.js"
                                    value={newFileName}
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-2">
                        {files.map((file) => (
                            <div
                                className={`group flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted ${file.id === activeFileId ? "bg-muted" : ""
                                    }`}
                                key={file.id}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id });
                                }}
                            >
                                <button
                                    className="flex flex-1 items-center gap-2 text-left"
                                    onClick={() => setActiveFileId(file.id)}
                                    type="button"
                                >
                                    <svg
                                        className="h-4 w-4 text-muted-foreground"
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
                                    <span className="truncate">{file.name}</span>
                                </button>
                                <button
                                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-background"
                                    onClick={() => deleteFile(file.id)}
                                    title="Delete"
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
                            </div>
                        ))}
                    </div>

                    {/* Participants */}
                    <div className="border-t p-2">
                        <div className="mb-2 px-2 font-semibold text-xs uppercase text-muted-foreground">
                            Participants
                        </div>
                        {roomData?.participants?.map((p: any, i: number) => (
                            <div
                                className="flex items-center gap-2 px-2 py-1 text-sm"
                                key={p.id}
                            >
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground">
                                    {p.userId === userId ? "You" : `User ${i + 1}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex flex-1 flex-col">
                    {/* Tabs */}
                    <div className="flex border-b bg-muted/20">
                        {files.map((file) => (
                            <button
                                className={`border-r px-4 py-2 text-sm transition-colors hover:bg-muted ${file.id === activeFileId
                                        ? "bg-background"
                                        : "bg-muted/20"
                                    }`}
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                type="button"
                            >
                                {file.name}
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
                    <div className="h-48 border-t bg-[#1e1e1e] p-4 font-mono text-sm">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-gray-400">TERMINAL</span>
                            <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => setOutput("")}
                                title="Clear"
                                type="button"
                            >
                                <svg
                                    className="h-4 w-4"
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
                        <pre className="text-green-400 whitespace-pre-wrap">
                            {output || "Ready to execute code. Click 'Run Code' to start."}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0"
                        onClick={() => setContextMenu(null)}
                    />
                    <div
                        className="fixed z-50 w-48 rounded-md border bg-popover p-1 shadow-lg"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button
                            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                            onClick={() => {
                                renameFile(contextMenu.fileId);
                                setContextMenu(null);
                            }}
                            type="button"
                        >
                            Rename
                        </button>
                        <button
                            className="w-full rounded px-2 py-1.5 text-left text-sm text-red-500 hover:bg-accent"
                            onClick={() => {
                                deleteFile(contextMenu.fileId);
                                setContextMenu(null);
                            }}
                            type="button"
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}

            {/* Status Bar */}
            <div className="flex items-center justify-between border-t bg-[#007acc] px-4 py-1 text-white text-xs">
                <div className="flex items-center gap-4">
                    <span>🔌 Live</span>
                    <span>{activeFile?.language.toUpperCase()}</span>
                </div>
                <div>Room: {roomId.slice(0, 8)}...</div>
            </div>
        </div>
    );
}
