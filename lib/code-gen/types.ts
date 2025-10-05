// Code Generation Types

export type Framework = "nextjs" | "react" | "vue" | "express" | "fastapi" | "django";
export type Language = "typescript" | "javascript" | "python" | "go";

export interface ProjectSpec {
  name: string;
  description: string;
  framework: Framework;
  language?: Language;
  features: string[];
  database?: "postgres" | "mysql" | "mongodb" | "sqlite";
  styling?: "tailwind" | "css" | "styled-components" | "sass";
  authentication?: boolean;
  api?: boolean;
}

export interface GeneratedProject {
  files: GeneratedFile[];
  structure: FileTree;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts: Record<string, string>;
  envVars: string[];
  readme: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
  size?: number;
}

export interface FileTree {
  name: string;
  type: "file" | "directory";
  children?: FileTree[];
  path: string;
}

export interface CodeModification {
  filePath: string;
  changes: CodeChange[];
  reason: string;
}

export interface CodeChange {
  type: "insert" | "replace" | "delete";
  startLine?: number;
  endLine?: number;
  content: string;
}

export interface RefactoringOptions {
  type: "extract-function" | "rename" | "inline" | "move" | "optimize";
  target: string;
  newName?: string;
  destination?: string;
}

export interface ErrorFix {
  error: string;
  file: string;
  line?: number;
  fix: string;
  explanation: string;
}

export interface FileMetadata {
  path: string;
  language: string;
  size: number;
  lines: number;
  lastModified: Date;
  dependencies: string[];
}
