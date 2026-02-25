import sharp from "sharp";

interface BrandKit {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  tone?: string;
}

interface CopyData {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

interface CompositeInput {
  backgroundBuffer: Buffer;
  brandKit: BrandKit;
  copy: CopyData;
  /** When true (Seedream), image already has text — only add logo + watermark */
  imageHasText?: boolean;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function compositePoster({
  backgroundBuffer,
  brandKit,
  copy,
  imageHasText = true,
}: CompositeInput): Promise<Buffer> {
  const SIZE = 1080;
  const PADDING = 64;

  const primary = brandKit.primaryColor || "#E8FF47";
  const secondary = brandKit.secondaryColor || "#111111";
  const accent = brandKit.accentColor || "#FFFFFF";

  const bg = await sharp(backgroundBuffer)
    .resize(SIZE, SIZE, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const compositeInputs: sharp.OverlayOptions[] = [];

  // User's logo: always composite in top-left (prominent) so it's clearly their brand, not any logo in the AI-generated image.
  const LOGO_SIZE = 112;
  if (brandKit.logoUrl) {
    try {
      const logoBuffer = await downloadImage(brandKit.logoUrl);
      if (logoBuffer) {
        const logoResized = await sharp(logoBuffer)
          .resize(LOGO_SIZE, LOGO_SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        compositeInputs.push({
          input: logoResized,
          top: PADDING,
          left: PADDING,
          blend: "over",
        });
      }
    } catch (err) {
      console.warn("[sharp] Logo composite failed:", err);
    }
  }

  if (imageHasText) {
    // Seedream already rendered text — no extra overlay; logo already added above

    const finalBuffer = await sharp(bg)
      .composite(compositeInputs)
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();
    console.log("[sharp] Poster composited (imageHasText). Size:", finalBuffer.length);
    return finalBuffer;
  }

  // Full overlay: headline, body, CTA, hashtags (Mystic fallback)
  const headline = escapeXml(copy.headline || brandKit.brandName);
  const subheadline = escapeXml(copy.subheadline || "");
  const body = escapeXml(copy.body || "");
  const cta = escapeXml(copy.cta || "Learn More");
  const hashtags = escapeXml(
    (copy.hashtags || []).slice(0, 4).join("  ")
  );
  const brandName = escapeXml(brandKit.brandName);

  const headlineLines = wrapText(copy.headline || brandKit.brandName, 18);
  const hl1 = escapeXml(headlineLines[0] || "");
  const hl2 = escapeXml(headlineLines[1] || "");

  const bodyLines = wrapText(copy.body || "", 38);
  const bl1 = escapeXml(bodyLines[0] || "");
  const bl2 = escapeXml(bodyLines[1] || "");

  const panelY = 620;
  const panelHeight = SIZE - panelY;

  const subheadY = panelY + 80 + (hl2 ? 140 : 90);
  const bodyY1 = panelY + 80 + (hl2 ? 185 : 140);
  const bodyY2 = panelY + 80 + (hl2 ? 210 : 165);

  const svg = `
<svg width="${SIZE}" height="${SIZE}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.0"/>
      <stop offset="30%" stop-color="${secondary}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.97"/>
    </linearGradient>

    <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${SIZE}" height="120"
        fill="url(#topGrad)" />

  <text
    x="${PADDING}"
    y="56"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="22"
    letter-spacing="3"
    fill="${primary}"
  >${brandName.toUpperCase()}</text>

  <circle cx="${PADDING + brandName.length * 13 + 8}" cy="50"
          r="4" fill="${primary}" opacity="0.6" />

  <rect x="0" y="${panelY}" width="${SIZE}"
        height="${panelHeight + 10}"
        fill="url(#panelGrad)" />

  <rect x="${PADDING}" y="${panelY + 40}"
        width="48" height="4"
        rx="2" fill="${primary}" />

  <text
    x="${PADDING}"
    y="${panelY + 80}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="900"
    font-size="${hl2 ? "64" : "72"}"
    fill="#FFFFFF"
    letter-spacing="-1"
  >${hl1}</text>

  ${hl2 ? `
  <text
    x="${PADDING}"
    y="${panelY + 150}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="900"
    font-size="64"
    fill="${primary}"
    letter-spacing="-1"
  >${hl2}</text>
  ` : ""}

  ${subheadline ? `
  <text
    x="${PADDING}"
    y="${subheadY}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="400"
    font-size="22"
    fill="rgba(255,255,255,0.75)"
    letter-spacing="0.3"
  >${subheadline}</text>
  ` : ""}

  ${bl1 ? `
  <text
    x="${PADDING}"
    y="${bodyY1}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="18"
    fill="rgba(255,255,255,0.6)"
    letter-spacing="0.2"
  >${bl1}</text>
  ` : ""}
  ${bl2 ? `
  <text
    x="${PADDING}"
    y="${bodyY2}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="18"
    fill="rgba(255,255,255,0.6)"
  >${bl2}</text>
  ` : ""}

  <rect
    x="${PADDING}"
    y="${SIZE - 130}"
    width="${Math.min(cta.length * 14 + 48, SIZE - PADDING * 2)}"
    height="48"
    rx="8"
    fill="${primary}"
  />
  <text
    x="${PADDING + 24}"
    y="${SIZE - 106}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="18"
    fill="${secondary}"
    dominant-baseline="middle"
  >${cta}</text>

  ${hashtags ? `
  <text
    x="${PADDING}"
    y="${SIZE - 30}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="14"
    fill="${primary}"
    opacity="0.5"
    letter-spacing="0.5"
  >${hashtags}</text>
  ` : ""}
</svg>`;

  const svgBuffer = Buffer.from(svg);

  const fullOverlayInputs: sharp.OverlayOptions[] = [
    { input: svgBuffer, top: 0, left: 0 },
  ];

  // User's logo: top-left, prominent (same as imageHasText path)
  const LOGO_SIZE_FULL = 112;
  if (brandKit.logoUrl) {
    try {
      const logoBuffer = await downloadImage(brandKit.logoUrl);
      if (logoBuffer) {
        const logoResized = await sharp(logoBuffer)
          .resize(LOGO_SIZE_FULL, LOGO_SIZE_FULL, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        fullOverlayInputs.push({
          input: logoResized,
          top: PADDING,
          left: PADDING,
          blend: "over",
        });
      }
    } catch (err) {
      console.warn("[sharp] Logo composite failed:", err);
    }
  }

  const finalBuffer = await sharp(bg)
    .composite(fullOverlayInputs)
    .png({ quality: 95, compressionLevel: 6 })
    .toBuffer();

  console.log("[sharp] Poster composited (full overlay). Size:", finalBuffer.length);
  return finalBuffer;
}
