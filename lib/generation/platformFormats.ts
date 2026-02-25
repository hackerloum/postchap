/**
 * Social platform poster formats: Freepik API aspect ratio + output dimensions (2026).
 * Used so users pick a platform and get the correct size for sharing.
 */
export interface PlatformFormat {
  id: string;
  label: string;
  /** Freepik Seedream aspect_ratio */
  freepikAspectRatio: string;
  width: number;
  height: number;
}

export const PLATFORM_FORMATS: PlatformFormat[] = [
  { id: "instagram_square", label: "Instagram Post (Square)", freepikAspectRatio: "square_1_1", width: 1080, height: 1080 },
  { id: "instagram_portrait", label: "Instagram Post (Portrait 4:5)", freepikAspectRatio: "social_post_4_5", width: 1080, height: 1350 },
  { id: "instagram_story", label: "Instagram Story / Reels / TikTok", freepikAspectRatio: "social_story_9_16", width: 1080, height: 1920 },
  { id: "facebook_post", label: "Facebook Post", freepikAspectRatio: "social_post_4_5", width: 1080, height: 1350 },
  { id: "twitter_post", label: "X (Twitter) Post", freepikAspectRatio: "standard_3_2", width: 1600, height: 900 },
  { id: "linkedin_post", label: "LinkedIn Post", freepikAspectRatio: "widescreen_16_9", width: 1200, height: 628 },
  { id: "youtube_thumbnail", label: "YouTube Thumbnail", freepikAspectRatio: "widescreen_16_9", width: 1920, height: 1080 },
  { id: "pinterest_pin", label: "Pinterest Pin", freepikAspectRatio: "portrait_2_3", width: 1000, height: 1500 },
];

const BY_ID = new Map(PLATFORM_FORMATS.map((f) => [f.id, f]));

export function getPlatformFormat(id: string | undefined | null): PlatformFormat {
  if (id && BY_ID.has(id)) return BY_ID.get(id)!;
  return PLATFORM_FORMATS[0];
}
