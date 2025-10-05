// Sandbox Management Service

import crypto from "node:crypto";
import type {
  Sandbox,
  Runtime,
  ExecutionResult,
  BuildResult,
  DependencyInstallResult,
  PreviewServer,
} from "./types";
import { WebContainerSandbox } from "./webcontainer";

export class SandboxManager {
  private sandboxes: Map<string, WebContainerSandbox> = new Map();
  private metadata: Map<string, Sandbox> = new Map();

  /**
   * Create a new sandbox
   */
  async createSandbox(params: {
    projectId: string;
    runtime: Runtime;
  }): Promise<Sandbox> {
    try {
      const sandboxId = crypto.randomUUID();

      // For now, only support Node.js via WebContainers
      if (params.runtime !== "node") {
        throw new Error(`Runtime ${params.runtime} not yet supported`);
      }

      const sandbox: Sandbox = {
        id: sandboxId,
        projectId: params.projectId,
        runtime: params.runtime,
        status: "initializing",
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.metadata.set(sandboxId, sandbox);

      // Initialize WebContainer
      const container = new WebContainerSandbox(sandboxId, params.projectId);
      await container.initialize();

      this.sandboxes.set(sandboxId, container);

      // Update status
      sandbox.status = "ready";
      this.metadata.set(sandboxId, sandbox);

      return sandbox;
    } catch (error) {
      console.error("Create sandbox error:", error);
      throw new Error("Failed to create sandbox");
    }
  }

  /**
   * Get a sandbox by ID
   */
  getSandbox(sandboxId: string): Sandbox | undefined {
    return this.metadata.get(sandboxId);
  }

  /**
   * Get sandbox container
   */
  getContainer(sandboxId: string): WebContainerSandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  /**
   * Execute code in a sandbox
   */
  async executeCode(params: {
    sandboxId: string;
    command: string;
    args?: string[];
  }): Promise<ExecutionResult> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    // Update last activity
    const sandbox = this.metadata.get(params.sandboxId);
    if (sandbox) {
      sandbox.lastActivity = new Date();
      sandbox.status = "running";
      this.metadata.set(params.sandboxId, sandbox);
    }

    try {
      const result = await container.executeCommand(
        params.command,
        params.args || []
      );

      // Update status
      if (sandbox) {
        sandbox.status = "ready";
        this.metadata.set(params.sandboxId, sandbox);
      }

      return result;
    } catch (error) {
      // Update status
      if (sandbox) {
        sandbox.status = "error";
        this.metadata.set(params.sandboxId, sandbox);
      }

      throw error;
    }
  }

  /**
   * Install dependencies in a sandbox
   */
  async installDependencies(params: {
    sandboxId: string;
    packageManager?: "npm" | "yarn" | "pnpm";
  }): Promise<DependencyInstallResult> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    const startTime = Date.now();

    try {
      const result = await container.installDependencies(
        params.packageManager || "npm"
      );

      return {
        success: result.success,
        installed: [], // Would parse from output
        failed: [],
        output: result.output,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        installed: [],
        failed: [],
        output: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Build a project in a sandbox
   */
  async buildProject(params: {
    sandboxId: string;
    buildCommand?: string;
  }): Promise<BuildResult> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    const startTime = Date.now();
    const command = params.buildCommand || "npm run build";
    const [cmd, ...args] = command.split(" ");

    try {
      const result = await container.executeCommand(cmd, args);

      return {
        success: result.success,
        output: result.output,
        errors: result.errors,
        artifacts: [], // Would list build artifacts
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        errors: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Start a preview server
   */
  async startPreviewServer(params: {
    sandboxId: string;
    command?: string;
  }): Promise<PreviewServer> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    const command = params.command || "npm run dev";
    const preview = await container.startDevServer(command);

    // Update sandbox metadata
    const sandbox = this.metadata.get(params.sandboxId);
    if (sandbox) {
      sandbox.url = preview.url;
      sandbox.port = preview.port;
      this.metadata.set(params.sandboxId, sandbox);
    }

    return preview;
  }

  /**
   * Mount files to a sandbox
   */
  async mountFiles(params: {
    sandboxId: string;
    files: Record<string, any>;
  }): Promise<void> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    await container.mountFiles(params.files);
  }

  /**
   * Read a file from a sandbox
   */
  async readFile(params: {
    sandboxId: string;
    path: string;
  }): Promise<string> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    return container.readFile(params.path);
  }

  /**
   * Write a file to a sandbox
   */
  async writeFile(params: {
    sandboxId: string;
    path: string;
    content: string;
  }): Promise<void> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    await container.writeFile(params.path, params.content);
  }

  /**
   * Delete a file from a sandbox
   */
  async deleteFile(params: {
    sandboxId: string;
    path: string;
  }): Promise<void> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    await container.deleteFile(params.path);
  }

  /**
   * List files in a sandbox directory
   */
  async listFiles(params: {
    sandboxId: string;
    path?: string;
  }): Promise<string[]> {
    const container = this.sandboxes.get(params.sandboxId);
    if (!container) {
      throw new Error("Sandbox not found");
    }

    return container.listFiles(params.path);
  }

  /**
   * Destroy a sandbox
   */
  async destroySandbox(sandboxId: string): Promise<void> {
    const container = this.sandboxes.get(sandboxId);
    if (container) {
      await container.teardown();
      this.sandboxes.delete(sandboxId);
    }

    this.metadata.delete(sandboxId);
  }

  /**
   * Get all sandboxes for a project
   */
  getProjectSandboxes(projectId: string): Sandbox[] {
    const sandboxes: Sandbox[] = [];

    for (const sandbox of this.metadata.values()) {
      if (sandbox.projectId === projectId) {
        sandboxes.push(sandbox);
      }
    }

    return sandboxes;
  }

  /**
   * Clean up inactive sandboxes
   */
  async cleanupInactiveSandboxes(maxInactiveMinutes: number = 30): Promise<number> {
    const now = Date.now();
    const maxInactiveMs = maxInactiveMinutes * 60 * 1000;
    let cleaned = 0;

    for (const [sandboxId, sandbox] of this.metadata.entries()) {
      const inactiveMs = now - sandbox.lastActivity.getTime();

      if (inactiveMs > maxInactiveMs) {
        await this.destroySandbox(sandboxId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
let sandboxManagerInstance: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!sandboxManagerInstance) {
    sandboxManagerInstance = new SandboxManager();
  }
  return sandboxManagerInstance;
}
