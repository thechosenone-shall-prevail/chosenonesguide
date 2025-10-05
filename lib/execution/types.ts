// Code Execution Types

export type Runtime = "node" | "python" | "go" | "rust";
export type SandboxStatus = "initializing" | "ready" | "running" | "stopped" | "error";

export interface Sandbox {
  id: string;
  projectId: string;
  runtime: Runtime;
  status: SandboxStatus;
  port?: number;
  url?: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  errors?: string;
  exitCode: number;
  duration: number;
  timestamp: Date;
}

export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  total: number;
  tests: TestCase[];
  duration: number;
}

export interface TestCase {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors?: string;
  artifacts?: string[];
  duration: number;
}

export interface DependencyInstallResult {
  success: boolean;
  installed: string[];
  failed: string[];
  output: string;
  duration: number;
}

export interface FileSystemOperation {
  type: "create" | "read" | "update" | "delete";
  path: string;
  content?: string;
}

export interface PreviewServer {
  url: string;
  port: number;
  status: "starting" | "running" | "stopped";
  logs: string[];
}
