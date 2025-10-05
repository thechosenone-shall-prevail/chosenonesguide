// WebContainer Integration for Node.js Execution

import type { WebContainer } from "@webcontainer/api";
import type {
  Sandbox,
  ExecutionResult,
  FileSystemOperation,
  PreviewServer,
} from "./types";

export class WebContainerSandbox {
  private container: WebContainer | null = null;
  private sandboxId: string;
  private projectId: string;

  constructor(sandboxId: string, projectId: string) {
    this.sandboxId = sandboxId;
    this.projectId = projectId;
  }

  /**
   * Initialize the WebContainer
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues
      const { WebContainer } = await import("@webcontainer/api");
      this.container = await WebContainer.boot();
      console.log("WebContainer initialized:", this.sandboxId);
    } catch (error) {
      console.error("WebContainer initialization error:", error);
      throw new Error("Failed to initialize WebContainer");
    }
  }

  /**
   * Mount files to the container
   */
  async mountFiles(files: Record<string, any>): Promise<void> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      await this.container.mount(files);
      console.log("Files mounted successfully");
    } catch (error) {
      console.error("Mount files error:", error);
      throw new Error("Failed to mount files");
    }
  }

  /**
   * Execute a command in the container
   */
  async executeCommand(
    command: string,
    args: string[] = []
  ): Promise<ExecutionResult> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    const startTime = Date.now();
    let output = "";
    let errors = "";

    try {
      const process = await this.container.spawn(command, args);

      // Capture stdout
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            output += data;
          },
        })
      );

      // Wait for process to complete
      const exitCode = await process.exit;
      const duration = Date.now() - startTime;

      return {
        success: exitCode === 0,
        output,
        errors: exitCode !== 0 ? output : undefined,
        exitCode,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output,
        errors: error instanceof Error ? error.message : "Unknown error",
        exitCode: 1,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Install dependencies
   */
  async installDependencies(
    packageManager: "npm" | "yarn" | "pnpm" = "npm"
  ): Promise<ExecutionResult> {
    const commands: Record<string, [string, string[]]> = {
      npm: ["npm", ["install"]],
      yarn: ["yarn", ["install"]],
      pnpm: ["pnpm", ["install"]],
    };

    const [cmd, args] = commands[packageManager];
    return this.executeCommand(cmd, args);
  }

  /**
   * Start a development server
   */
  async startDevServer(command: string = "npm run dev"): Promise<PreviewServer> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      const [cmd, ...args] = command.split(" ");
      const process = await this.container.spawn(cmd, args);

      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get server URL
      this.container.on("server-ready", (port, url) => {
        console.log("Server ready:", url);
      });

      return {
        url: "http://localhost:3000", // This would be dynamic
        port: 3000,
        status: "running",
        logs: [],
      };
    } catch (error) {
      console.error("Start dev server error:", error);
      throw new Error("Failed to start development server");
    }
  }

  /**
   * Read a file from the container
   */
  async readFile(path: string): Promise<string> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      const file = await this.container.fs.readFile(path, "utf-8");
      return file;
    } catch (error) {
      console.error("Read file error:", error);
      throw new Error(`Failed to read file: ${path}`);
    }
  }

  /**
   * Write a file to the container
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      await this.container.fs.writeFile(path, content);
    } catch (error) {
      console.error("Write file error:", error);
      throw new Error(`Failed to write file: ${path}`);
    }
  }

  /**
   * Delete a file from the container
   */
  async deleteFile(path: string): Promise<void> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      await this.container.fs.rm(path);
    } catch (error) {
      console.error("Delete file error:", error);
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = "/"): Promise<string[]> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      const files = await this.container.fs.readdir(path);
      return files;
    } catch (error) {
      console.error("List files error:", error);
      throw new Error(`Failed to list files in: ${path}`);
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<void> {
    if (!this.container) {
      throw new Error("Container not initialized");
    }

    try {
      await this.container.fs.mkdir(path, { recursive: true });
    } catch (error) {
      console.error("Create directory error:", error);
      throw new Error(`Failed to create directory: ${path}`);
    }
  }

  /**
   * Tear down the container
   */
  async teardown(): Promise<void> {
    if (this.container) {
      await this.container.teardown();
      this.container = null;
      console.log("WebContainer torn down:", this.sandboxId);
    }
  }

  /**
   * Get container instance
   */
  getContainer(): WebContainer | null {
    return this.container;
  }
}
