/**
 * Unified image provider + model list.
 * Shared between frontend (selector UI) and backend (routing logic).
 *
 * Provider families:
 * - freepik:seedream  → Freepik Seedream v4.5 (primary, async poll)
 * - freepik:mystic    → Freepik Mystic (realism fallback)
 * - gemini:*          → Nano Banana models via Google Gemini API
 */

export type ImageProviderId =
  | "freepik:seedream"
  | "freepik:mystic"
  | "gemini:3.1-flash"
  | "gemini:3-pro"
  | "gemini:2.5-flash";

export interface ImageProvider {
  id: ImageProviderId;
  label: string;
  provider: "freepik" | "gemini";
  /** Gemini model name — only for gemini providers */
  geminiModel?: string;
  /** Short description shown in the UI */
  description: string;
  /** Optional badge shown next to label */
  badge?: string;
}

export const IMAGE_PROVIDERS: ImageProvider[] = [
  {
    id: "freepik:seedream",
    label: "Seedream v4.5",
    provider: "freepik",
    description: "Freepik's flagship model. High quality photorealistic images.",
    badge: "Freepik",
  },
  {
    id: "freepik:mystic",
    label: "Mystic (Realism)",
    provider: "freepik",
    description: "Freepik Mystic model. Strong photorealism and detail.",
    badge: "Freepik",
  },
  {
    id: "gemini:3.1-flash",
    label: "Nano Banana 2 (Flash)",
    provider: "gemini",
    geminiModel: "gemini-3.1-flash-image-preview",
    description: "Best speed/quality balance. 2K output with thinking.",
    badge: "Gemini",
  },
  {
    id: "gemini:3-pro",
    label: "Nano Banana Pro",
    provider: "gemini",
    geminiModel: "gemini-3-pro-image-preview",
    description: "Professional asset quality. 4K, advanced reasoning.",
    badge: "Gemini",
  },
  {
    id: "gemini:2.5-flash",
    label: "Nano Banana",
    provider: "gemini",
    geminiModel: "gemini-2.5-flash-image",
    description: "Fastest Gemini model. Great for high-volume generation.",
    badge: "Gemini",
  },
];

const PROVIDER_MAP = new Map<ImageProviderId, ImageProvider>(
  IMAGE_PROVIDERS.map((p) => [p.id, p])
);

export function getImageProvider(id: string): ImageProvider | undefined {
  return PROVIDER_MAP.get(id as ImageProviderId);
}

export function isValidImageProviderId(id: string): id is ImageProviderId {
  return PROVIDER_MAP.has(id as ImageProviderId);
}

/** Default provider used when none is selected */
export const DEFAULT_IMAGE_PROVIDER: ImageProviderId = "freepik:seedream";
