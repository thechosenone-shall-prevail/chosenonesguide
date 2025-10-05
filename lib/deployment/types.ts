// Deployment Types

export type DeploymentPlatform = "vercel" | "netlify" | "railway" | "render";
export type DeploymentStatusType = "pending" | "building" | "deployed" | "failed";

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
  status: DeploymentStatusType;
  logs: string[];
  error?: string;
  duration: number;
}

export interface DeploymentStatus {
  id: string;
  status: DeploymentStatusType;
  url?: string;
  createdAt: Date;
  completedAt?: Date;
  logs: string[];
}
