// Theme System Types

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isPremium: boolean;
  colors: ThemeColors;
  gradients: ThemeGradients;
  particles: ParticleConfig;
  soundscape: SoundscapeConfig;
  animations: AnimationConfig;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeGradients {
  hero: string;
  card: string;
  button: string;
  background: string;
}

export interface ParticleConfig {
  enabled: boolean;
  density: number;
  color: string;
  speed: number;
  size: number;
  opacity: number;
  shape: "circle" | "square" | "triangle";
}

export interface SoundscapeConfig {
  enabled: boolean;
  url?: string;
  volume: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
}

export interface AnimationConfig {
  enabled: boolean;
  intensity: "low" | "medium" | "high";
  duration: number;
  easing: string;
}

export interface UserThemePreferences {
  currentTheme: string;
  soundEnabled: boolean;
  particlesEnabled: boolean;
  animationsEnabled: boolean;
  customThemes: string[];
}
