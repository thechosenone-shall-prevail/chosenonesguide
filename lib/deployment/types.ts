// Deployment Types

export type DeploymentPlatform = "vercel" | "netlify" | "railway" | "render";
export type DeploymentStatus = "pending" | "building" | "deployed" | "failed";

export interface DeploymentConfig {
  platform: DeploymentPlatform;
  projectId: string;
  projectName: string;
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  envVars?: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  url?: string;
  status: DeploymentStatus;
  logs: string[];
  error?: string;
  duration: number;
}

export interface DeploymentStatus {
  id: string;
  status: DeploymentStatus;
  url?: string;
  createdAt: Date;
  completedAt?: Date;
  logs: string[];
}
