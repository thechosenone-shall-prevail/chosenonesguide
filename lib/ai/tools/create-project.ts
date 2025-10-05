import { tool } from "ai";
import { z } from "zod";

export const createProject = tool({
  description:
    "Create a new collaborative coding project/room. Use this when the user wants to build something, create a project, or start coding collaboratively.",
  inputSchema: z.object({
    name: z.string().describe("Name of the project/room"),
    description: z
      .string()
      .describe("Brief description of what will be built"),
    language: z
      .enum(["javascript", "typescript", "python", "html", "react"])
      .describe("Primary programming language for the project"),
  }),
  execute: async ({ name, description, language }) => {
    // This will be handled on the client side
    return {
      type: "create-project",
      name,
      description,
      language,
      message: `I'll create a collaborative coding room for "${name}". Click the button below to start coding!`,
    };
  },
});
