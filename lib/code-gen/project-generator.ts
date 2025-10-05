// Project Generation Service

import type {
  ProjectSpec,
  GeneratedProject,
  GeneratedFile,
  FileTree,
  CodeModification,
  RefactoringOptions,
  ErrorFix,
  FileMetadata,
} from "./types";
import { generateNextJsProject } from "./templates/nextjs";

export class ProjectGenerator {
  /**
   * Generate a complete project based on specifications
   */
  async generateProject(spec: ProjectSpec): Promise<GeneratedProject> {
    try {
      let files: GeneratedFile[] = [];

      // Generate files based on framework
      switch (spec.framework) {
        case "nextjs":
          files = generateNextJsProject(spec);
          break;
        case "react":
          files = this.generateReactProject(spec);
          break;
        case "vue":
          files = this.generateVueProject(spec);
          break;
        case "express":
          files = this.generateExpressProject(spec);
          break;
        case "fastapi":
          files = this.generateFastAPIProject(spec);
          break;
        case "django":
          files = this.generateDjangoProject(spec);
          break;
        default:
          throw new Error(`Unsupported framework: ${spec.framework}`);
      }

      // Build file tree
      const structure = this.buildFileTree(files);

      // Extract dependencies
      const packageJson = files.find((f) => f.path === "package.json");
      let dependencies: Record<string, string> = {};
      let devDependencies: Record<string, string> = {};
      let scripts: Record<string, string> = {};

      if (packageJson) {
        const pkg = JSON.parse(packageJson.content);
        dependencies = pkg.dependencies || {};
        devDependencies = pkg.devDependencies || {};
        scripts = pkg.scripts || {};
      }

      // Extract environment variables
      const envFile = files.find((f) => f.path === ".env.example");
      const envVars = envFile
        ? envFile.content.split("\n").filter((line) => line.trim())
        : [];

      // Get README
      const readmeFile = files.find((f) => f.path === "README.md");
      const readme = readmeFile?.content || "";

      return {
        files,
        structure,
        dependencies,
        devDependencies,
        scripts,
        envVars,
        readme,
      };
    } catch (error) {
      console.error("Project generation error:", error);
      throw new Error("Failed to generate project");
    }
  }

  /**
   * Generate a single file
   */
  async generateFile(params: {
    path: string;
    language: string;
    description: string;
    context?: string;
  }): Promise<GeneratedFile> {
    // This would use AI to generate the file content
    // For now, return a template
    return {
      path: params.path,
      content: this.generateFileTemplate(params.language, params.description),
      language: params.language,
      description: params.description,
    };
  }

  /**
   * Modify existing code
   */
  async modifyCode(params: {
    filePath: string;
    currentContent: string;
    modifications: string;
  }): Promise<CodeModification> {
    // This would use AI to intelligently modify code
    // For now, return a simple modification
    return {
      filePath: params.filePath,
      changes: [
        {
          type: "replace",
          startLine: 1,
          endLine: 1,
          content: "// Modified code",
        },
      ],
      reason: params.modifications,
    };
  }

  /**
   * Refactor code
   */
  async refactorCode(params: {
    filePath: string;
    content: string;
    options: RefactoringOptions;
  }): Promise<string> {
    // This would use AI to refactor code
    // For now, return the original content
    return params.content;
  }

  /**
   * Fix errors in code
   */
  async fixErrors(params: {
    filePath: string;
    content: string;
    errors: string[];
  }): Promise<ErrorFix[]> {
    // This would use AI to fix errors
    // For now, return empty fixes
    return params.errors.map((error) => ({
      error,
      file: params.filePath,
      fix: "// Error fix would go here",
      explanation: "AI-generated fix explanation",
    }));
  }

  /**
   * Get file metadata
   */
  getFileMetadata(file: GeneratedFile): FileMetadata {
    const lines = file.content.split("\n").length;
    const size = Buffer.byteLength(file.content, "utf8");

    return {
      path: file.path,
      language: file.language,
      size,
      lines,
      lastModified: new Date(),
      dependencies: this.extractDependencies(file.content, file.language),
    };
  }

  // Private helper methods

  private generateReactProject(spec: ProjectSpec): GeneratedFile[] {
    // Simplified React project generation
    return [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: spec.name,
            version: "0.1.0",
            dependencies: {
              react: "^18.0.0",
              "react-dom": "^18.0.0",
            },
          },
          null,
          2
        ),
        language: "json",
        description: "Package configuration",
      },
      {
        path: "src/App.tsx",
        content: `export default function App() {
  return <div><h1>${spec.name}</h1></div>;
}`,
        language: "typescriptreact",
        description: "Main App component",
      },
    ];
  }

  private generateVueProject(spec: ProjectSpec): GeneratedFile[] {
    return [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: spec.name,
            version: "0.1.0",
            dependencies: {
              vue: "^3.0.0",
            },
          },
          null,
          2
        ),
        language: "json",
        description: "Package configuration",
      },
    ];
  }

  private generateExpressProject(spec: ProjectSpec): GeneratedFile[] {
    return [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: spec.name,
            version: "0.1.0",
            dependencies: {
              express: "^4.18.0",
            },
          },
          null,
          2
        ),
        language: "json",
        description: "Package configuration",
      },
      {
        path: "index.js",
        content: `const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('${spec.name}');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
        language: "javascript",
        description: "Express server",
      },
    ];
  }

  private generateFastAPIProject(spec: ProjectSpec): GeneratedFile[] {
    return [
      {
        path: "requirements.txt",
        content: "fastapi\nuvicorn[standard]",
        language: "plaintext",
        description: "Python dependencies",
      },
      {
        path: "main.py",
        content: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "${spec.name}"}`,
        language: "python",
        description: "FastAPI application",
      },
    ];
  }

  private generateDjangoProject(spec: ProjectSpec): GeneratedFile[] {
    return [
      {
        path: "requirements.txt",
        content: "django>=4.0",
        language: "plaintext",
        description: "Python dependencies",
      },
    ];
  }

  private buildFileTree(files: GeneratedFile[]): FileTree {
    const root: FileTree = {
      name: "root",
      type: "directory",
      path: "/",
      children: [],
    };

    for (const file of files) {
      const parts = file.path.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!current.children) {
          current.children = [];
        }

        let child = current.children.find((c) => c.name === part);

        if (!child) {
          child = {
            name: part,
            type: isLast ? "file" : "directory",
            path: parts.slice(0, i + 1).join("/"),
            children: isLast ? undefined : [],
          };
          current.children.push(child);
        }

        if (!isLast) {
          current = child;
        }
      }
    }

    return root;
  }

  private generateFileTemplate(language: string, description: string): string {
    const templates: Record<string, string> = {
      typescript: `// ${description}\n\nexport function example() {\n  // Implementation\n}\n`,
      javascript: `// ${description}\n\nfunction example() {\n  // Implementation\n}\n\nmodule.exports = { example };\n`,
      python: `"""${description}"""\n\ndef example():\n    # Implementation\n    pass\n`,
      go: `package main\n\n// ${description}\nfunc example() {\n    // Implementation\n}\n`,
    };

    return templates[language] || `// ${description}\n`;
  }

  private extractDependencies(content: string, language: string): string[] {
    const dependencies: string[] = [];

    if (language === "typescript" || language === "javascript") {
      const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

      let match;
      while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
      while ((match = requireRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
      }
    } else if (language === "python") {
      const importRegex = /^import\s+(\w+)|^from\s+(\w+)\s+import/gm;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1] || match[2]);
      }
    }

    return [...new Set(dependencies)];
  }
}

// Singleton instance
let projectGeneratorInstance: ProjectGenerator | null = null;

export function getProjectGenerator(): ProjectGenerator {
  if (!projectGeneratorInstance) {
    projectGeneratorInstance = new ProjectGenerator();
  }
  return projectGeneratorInstance;
}
