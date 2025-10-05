// Next.js Project Templates

import type { GeneratedFile, ProjectSpec } from "../types";

export function generateNextJsProject(spec: ProjectSpec): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // package.json
  files.push({
    path: "package.json",
    content: generatePackageJson(spec),
    language: "json",
    description: "Package configuration",
  });

  // tsconfig.json
  if (spec.language === "typescript") {
    files.push({
      path: "tsconfig.json",
      content: generateTsConfig(),
      language: "json",
      description: "TypeScript configuration",
    });
  }

  // next.config.js
  files.push({
    path: spec.language === "typescript" ? "next.config.ts" : "next.config.js",
    content: generateNextConfig(spec),
    language: spec.language === "typescript" ? "typescript" : "javascript",
    description: "Next.js configuration",
  });

  // app/layout
  files.push({
    path: `app/layout.${spec.language === "typescript" ? "tsx" : "jsx"}`,
    content: generateLayout(spec),
    language: spec.language === "typescript" ? "typescriptreact" : "javascriptreact",
    description: "Root layout component",
  });

  // app/page
  files.push({
    path: `app/page.${spec.language === "typescript" ? "tsx" : "jsx"}`,
    content: generateHomePage(spec),
    language: spec.language === "typescript" ? "typescriptreact" : "javascriptreact",
    description: "Home page component",
  });

  // globals.css
  if (spec.styling === "tailwind" || spec.styling === "css") {
    files.push({
      path: "app/globals.css",
      content: generateGlobalStyles(spec),
      language: "css",
      description: "Global styles",
    });
  }

  // tailwind.config
  if (spec.styling === "tailwind") {
    files.push({
      path: "tailwind.config.ts",
      content: generateTailwindConfig(),
      language: "typescript",
      description: "Tailwind CSS configuration",
    });
  }

  // .env.example
  files.push({
    path: ".env.example",
    content: generateEnvExample(spec),
    language: "plaintext",
    description: "Environment variables template",
  });

  // README.md
  files.push({
    path: "README.md",
    content: generateReadme(spec),
    language: "markdown",
    description: "Project documentation",
  });

  // .gitignore
  files.push({
    path: ".gitignore",
    content: generateGitignore(),
    language: "plaintext",
    description: "Git ignore rules",
  });

  return files;
}

function generatePackageJson(spec: ProjectSpec): string {
  const dependencies: Record<string, string> = {
    next: "15.0.0",
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  };

  const devDependencies: Record<string, string> = {};

  if (spec.language === "typescript") {
    dependencies["typescript"] = "^5.0.0";
    dependencies["@types/react"] = "^18.0.0";
    dependencies["@types/react-dom"] = "^18.0.0";
    dependencies["@types/node"] = "^20.0.0";
  }

  if (spec.styling === "tailwind") {
    devDependencies["tailwindcss"] = "^3.4.0";
    devDependencies["postcss"] = "^8.4.0";
    devDependencies["autoprefixer"] = "^10.4.0";
  }

  if (spec.database === "postgres") {
    dependencies["pg"] = "^8.11.0";
    dependencies["drizzle-orm"] = "^0.34.0";
    devDependencies["drizzle-kit"] = "^0.24.0";
  }

  return JSON.stringify(
    {
      name: spec.name.toLowerCase().replace(/\s+/g, "-"),
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies,
      devDependencies,
    },
    null,
    2
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next",
          },
        ],
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
}

function generateNextConfig(spec: ProjectSpec): string {
  const ext = spec.language === "typescript" ? "ts" : "js";
  
  if (ext === "ts") {
    return `import type { NextConfig } from "next";

const config: NextConfig = {
  /* config options here */
};

export default config;
`;
  }

  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

module.exports = nextConfig;
`;
}

function generateLayout(spec: ProjectSpec): string {
  const isTS = spec.language === "typescript";
  const importStyles = spec.styling === "tailwind" || spec.styling === "css" 
    ? `import "./globals.css";\n` 
    : "";

  if (isTS) {
    return `${importStyles}import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${spec.name}",
  description: "${spec.description}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  }

  return `${importStyles}
export const metadata = {
  title: "${spec.name}",
  description: "${spec.description}",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function generateHomePage(spec: ProjectSpec): string {
  const isTS = spec.language === "typescript";

  return `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">${spec.name}</h1>
      <p className="text-lg text-gray-600">${spec.description}</p>
    </main>
  );
}
`;
}

function generateGlobalStyles(spec: ProjectSpec): string {
  if (spec.styling === "tailwind") {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`;
  }

  return `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

a {
  color: inherit;
  text-decoration: none;
}
`;
}

function generateTailwindConfig(): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

function generateEnvExample(spec: ProjectSpec): string {
  const vars: string[] = [];

  if (spec.database === "postgres") {
    vars.push("DATABASE_URL=postgresql://...");
  }

  if (spec.authentication) {
    vars.push("NEXTAUTH_SECRET=your-secret-here");
    vars.push("NEXTAUTH_URL=http://localhost:3000");
  }

  return vars.join("\n");
}

function generateReadme(spec: ProjectSpec): string {
  return `# ${spec.name}

${spec.description}

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

${spec.features.map((f) => `- ${f}`).join("\n")}

## Tech Stack

- **Framework**: Next.js 15
- **Language**: ${spec.language === "typescript" ? "TypeScript" : "JavaScript"}
${spec.styling ? `- **Styling**: ${spec.styling}` : ""}
${spec.database ? `- **Database**: ${spec.database}` : ""}

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).
`;
}

function generateGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}
