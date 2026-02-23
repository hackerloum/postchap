import sharp from "sharp";
import type { BrandKit, CopyData, PosterSize } from "@/types/generation";

// Suppress fontconfig warning on Vercel serverless (we use Arial/Helvetica in SVG)
if (typeof process !== "undefined" && !process.env.FONTCONFIG_PATH) {
  process.env.FONTCONFIG_PATH = "/etc/fonts";
}

const SIZE_MAP: Record<PosterSize, { width: number; height: number }> = {
  "1080x1080": { width: 1080, height: 1080 },
  "1080x1350": { width: 1080, height: 1350 },
  "1080x1920": { width: 1080, height: 1920 },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function compositePoster(
  backgroundBuffer: Buffer,
  copy: CopyData,
  brandKit: BrandKit,
  posterSize: PosterSize
): Promise<Buffer> {
  const { width, height } = SIZE_MAP[posterSize];

  const resizedBg = await sharp(backgroundBuffer)
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();

  const headline = copy.headline || "Headline";
  const cta = copy.cta || "Learn more";
  const primaryColor = brandKit.primaryColor || "#E8FF47";
  const textColor = brandKit.secondaryColor || "#111111";

  const svgText =
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<style>.headline{font:bold 56px Arial,Helvetica,sans-serif;fill:${textColor}}.cta{font:bold 32px Arial,Helvetica,sans-serif;fill:${primaryColor}}</style>` +
    `<text x="${width / 2}" y="${height - 180}" text-anchor="middle" class="headline">${escapeXml(headline)}</text>` +
    `<text x="${width / 2}" y="${height - 100}" text-anchor="middle" class="cta">${escapeXml(cta)}</text>` +
    `</svg>`;

  const textBuffer = Buffer.from(svgText);
  const composed = await sharp(resizedBg)
    .composite([{ input: textBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  if (brandKit.logoUrl) {
    try {
      const logoRes = await fetch(brandKit.logoUrl);
      if (logoRes.ok) {
        const logoBuf = Buffer.from(await logoRes.arrayBuffer());
        const padded = await sharp(logoBuf)
          .resize(120, 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        return await sharp(composed)
          .composite([{ input: padded, top: 40, left: 40 }])
          .png()
          .toBuffer();
      }
    } catch {
      // ignore logo failure
    }
  }

  return composed;
}
