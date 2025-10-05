export const DEFAULT_CHAT_MODEL: string = "deepseek-chat";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  provider: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    description: "Fast and efficient general-purpose model",
    provider: "deepseek",
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    description: "Specialized for code generation and debugging",
    provider: "deepseek",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    description: "Advanced reasoning for complex problem solving",
    provider: "deepseek",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's most advanced multimodal model",
    provider: "openai",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Faster and more affordable GPT-4 variant",
    provider: "openai",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's most intelligent model",
    provider: "anthropic",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    description: "Fast and cost-effective Claude model",
    provider: "anthropic",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Google's fastest multimodal model",
    provider: "google",
  },
];
