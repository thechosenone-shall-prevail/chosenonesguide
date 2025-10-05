// Theme Management Service

import { db } from "@/lib/db";
import { theme, userProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ThemeConfig, UserThemePreferences } from "./types";
import { SYSTEM_THEMES, getThemeById } from "./system-themes";

export class ThemeManager {
  /**
   * Get theme by ID
   */
  async getTheme(themeId: string): Promise<ThemeConfig | null> {
    try {
      // Check system themes first
      const systemTheme = getThemeById(themeId);
      if (systemTheme) {
        return systemTheme;
      }

      // Check custom themes in database
      const [customTheme] = await db
        .select()
        .from(theme)
        .where(eq(theme.id, themeId))
        .limit(1);

      if (!customTheme) {
        return null;
      }

      return customTheme.config as ThemeConfig;
    } catch (error) {
      console.error("Get theme error:", error);
      return null;
    }
  }

  /**
   * Get all available themes for a user
   */
  async getUserThemes(
    userId: string,
    includeSystem = true
  ): Promise<ThemeConfig[]> {
    try {
      const themes: ThemeConfig[] = [];

      // Add system themes
      if (includeSystem) {
        themes.push(...SYSTEM_THEMES);
      }

      // Add user's custom themes
      const customThemes = await db
        .select()
        .from(theme)
        .where(eq(theme.userId, userId));

      for (const t of customThemes) {
        themes.push(t.config as ThemeConfig);
      }

      return themes;
    } catch (error) {
      console.error("Get user themes error:", error);
      return includeSystem ? SYSTEM_THEMES : [];
    }
  }

  /**
   * Create custom theme
   */
  async createCustomTheme(
    userId: string,
    themeConfig: ThemeConfig
  ): Promise<ThemeConfig> {
    try {
      const [newTheme] = await db
        .insert(theme)
        .values({
          userId,
          name: themeConfig.name,
          description: themeConfig.description,
          isSystem: false,
          isPremium: false,
          config: themeConfig as any,
        })
        .returning();

      return newTheme.config as ThemeConfig;
    } catch (error) {
      console.error("Create custom theme error:", error);
      throw new Error("Failed to create custom theme");
    }
  }

  /**
   * Update custom theme
   */
  async updateCustomTheme(
    themeId: string,
    userId: string,
    updates: Partial<ThemeConfig>
  ): Promise<ThemeConfig> {
    try {
      // Get existing theme
      const [existing] = await db
        .select()
        .from(theme)
        .where(eq(theme.id, themeId))
        .limit(1);

      if (!existing || existing.userId !== userId) {
        throw new Error("Theme not found or access denied");
      }

      const updatedConfig = {
        ...(existing.config as ThemeConfig),
        ...updates,
      };

      const [updated] = await db
        .update(theme)
        .set({
          name: updatedConfig.name,
          description: updatedConfig.description,
          config: updatedConfig as any,
        })
        .where(eq(theme.id, themeId))
        .returning();

      return updated.config as ThemeConfig;
    } catch (error) {
      console.error("Update custom theme error:", error);
      throw new Error("Failed to update custom theme");
    }
  }

  /**
   * Delete custom theme
   */
  async deleteCustomTheme(themeId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(theme)
        .where(eq(theme.id, themeId));
    } catch (error) {
      console.error("Delete custom theme error:", error);
      throw new Error("Failed to delete custom theme");
    }
  }

  /**
   * Get user theme preferences
   */
  async getUserPreferences(userId: string): Promise<UserThemePreferences> {
    try {
      const [profile] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);

      if (!profile || !profile.preferences) {
        return this.getDefaultPreferences();
      }

      const prefs = profile.preferences as any;
      return {
        currentTheme: prefs.defaultTheme || "midnight-hacker",
        soundEnabled: prefs.soundEnabled ?? true,
        particlesEnabled: prefs.particlesEnabled ?? true,
        animationsEnabled: !prefs.reducedMotion,
        customThemes: prefs.customThemes || [],
      };
    } catch (error) {
      console.error("Get user preferences error:", error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user theme preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserThemePreferences>
  ): Promise<void> {
    try {
      // Get existing profile
      const [existing] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);

      const currentPrefs = (existing?.preferences as any) || {};
      const updatedPrefs = {
        ...currentPrefs,
        defaultTheme: preferences.currentTheme || currentPrefs.defaultTheme,
        soundEnabled: preferences.soundEnabled ?? currentPrefs.soundEnabled,
        particlesEnabled: preferences.particlesEnabled ?? currentPrefs.particlesEnabled,
        reducedMotion: preferences.animationsEnabled === false,
        customThemes: preferences.customThemes || currentPrefs.customThemes,
      };

      if (existing) {
        await db
          .update(userProfile)
          .set({
            preferences: updatedPrefs as any,
            updatedAt: new Date(),
          })
          .where(eq(userProfile.userId, userId));
      } else {
        await db.insert(userProfile).values({
          userId,
          preferences: updatedPrefs as any,
        });
      }
    } catch (error) {
      console.error("Update user preferences error:", error);
      throw new Error("Failed to update preferences");
    }
  }

  /**
   * Apply theme (returns CSS variables)
   */
  applyTheme(themeConfig: ThemeConfig): Record<string, string> {
    const cssVars: Record<string, string> = {};

    // Colors
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      cssVars[`--${key}`] = value;
    });

    // Gradients
    Object.entries(themeConfig.gradients).forEach(([key, value]) => {
      cssVars[`--gradient-${key}`] = value;
    });

    // Animation duration
    cssVars["--animation-duration"] = `${themeConfig.animations.duration}ms`;
    cssVars["--animation-easing"] = themeConfig.animations.easing;

    return cssVars;
  }

  /**
   * Preload theme assets (soundscapes, etc.)
   */
  async preloadThemeAssets(themeConfig: ThemeConfig): Promise<void> {
    const promises: Promise<any>[] = [];

    // Preload soundscape
    if (themeConfig.soundscape.enabled && themeConfig.soundscape.url) {
      promises.push(
        fetch(themeConfig.soundscape.url).catch((err) =>
          console.warn("Failed to preload soundscape:", err)
        )
      );
    }

    await Promise.all(promises);
  }

  // Private helper methods

  private getDefaultPreferences(): UserThemePreferences {
    return {
      currentTheme: "midnight-hacker",
      soundEnabled: true,
      particlesEnabled: true,
      animationsEnabled: true,
      customThemes: [],
    };
  }
}

// Singleton instance
let themeManagerInstance: ThemeManager | null = null;

export function getThemeManager(): ThemeManager {
  if (!themeManagerInstance) {
    themeManagerInstance = new ThemeManager();
  }
  return themeManagerInstance;
}
