import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: [
      "deepseek-chat",
      "deepseek-coder",
      "deepseek-reasoner",
      "gpt-4o-mini",
      "claude-3-5-haiku",
      "gemini-2.0-flash",
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      "deepseek-chat",
      "deepseek-coder",
      "deepseek-reasoner",
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "claude-3-5-haiku",
      "gemini-2.0-flash",
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
