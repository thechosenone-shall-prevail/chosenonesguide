import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// DeepSeek provider (OpenAI-compatible)
// IMPORTANT: Use chat() method to get chat completion models, NOT the default which uses responses API
const deepseekProvider = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-placeholder",
  baseURL: "https://api.deepseek.com/v1",
});

// Helper to get chat completion models (not responses models)
const deepseek = (modelId: string) => deepseekProvider.chat(modelId);

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // DeepSeek models - using actual DeepSeek model names
        "deepseek-chat": deepseek("deepseek-chat"),
        "deepseek-coder": deepseek("deepseek-coder"),
        "deepseek-reasoner": deepseek("deepseek-reasoner"),

        // All other models use deepseek-chat for testing
        "gpt-4o": deepseek("deepseek-chat"),
        "gpt-4o-mini": deepseek("deepseek-chat"),
        "claude-3-5-sonnet": deepseek("deepseek-chat"),
        "claude-3-5-haiku": deepseek("deepseek-chat"),
        "gemini-2.0-flash": deepseek("deepseek-chat"),

        // Legacy models for compatibility
        "title-model": deepseek("deepseek-chat"),
        "artifact-model": deepseek("deepseek-chat"),
      },
    });
