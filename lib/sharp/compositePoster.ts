import sharp from "sharp";

interface BrandKit {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  tone?: string;
  phoneNumber?: string;
  contactLocation?: string;
  website?: string;
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
  /** Output dimensions (default 1080×1080) */
  width?: number;
  height?: number;
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

const BASE = 1080;
const PADDING_BASE = 64;

export async function compositePoster({
  backgroundBuffer,
  brandKit,
  copy,
  imageHasText = true,
  width: inputW,
  height: inputH,
}: CompositeInput): Promise<Buffer> {
  const W = inputW ?? BASE;
  const H = inputH ?? BASE;
  const scaleX = W / BASE;
  const scaleY = H / BASE;
  const scale = Math.min(scaleX, scaleY);
  const PADDING = Math.round(PADDING_BASE * scale);

  const primary = brandKit.primaryColor || "#E8FF47";
  const secondary = brandKit.secondaryColor || "#111111";
  const accent = brandKit.accentColor || "#FFFFFF";

  const bg = await sharp(backgroundBuffer)
    .resize(W, H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const compositeInputs: sharp.OverlayOptions[] = [];

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
    const hasContactText =
      (brandKit.phoneNumber && brandKit.phoneNumber.trim()) ||
      (brandKit.contactLocation && brandKit.contactLocation.trim()) ||
      (brandKit.website && brandKit.website.trim());
    if (hasContactText) {
      const parts: string[] = [];
      if (brandKit.phoneNumber?.trim()) parts.push(brandKit.phoneNumber.trim());
      if (brandKit.contactLocation?.trim()) parts.push(brandKit.contactLocation.trim());
      if (brandKit.website?.trim()) parts.push(brandKit.website.trim());
      const line = parts.join("  •  ");
      const contactBarH = Math.round(44 * scale);
      const contactSvg = `<svg width="${W}" height="${contactBarH}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${contactBarH}" fill="${secondary}" opacity="0.85"/><text x="${W / 2}" y="${contactBarH / 2 + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(12 * scale)}" fill="${primary}" opacity="0.95" dominant-baseline="middle">${escapeXml(line)}</text></svg>`;
      compositeInputs.push({
        input: Buffer.from(contactSvg),
        top: H - contactBarH,
        left: 0,
        blend: "over",
      });
    }
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

  const panelY = Math.round(620 * scaleY);
  const panelHeight = H - panelY;

  const subheadY = panelY + Math.round(80 * scaleY) + (hl2 ? Math.round(140 * scaleY) : Math.round(90 * scaleY));
  const bodyY1 = panelY + Math.round(80 * scaleY) + (hl2 ? Math.round(185 * scaleY) : Math.round(140 * scaleY));
  const bodyY2 = panelY + Math.round(80 * scaleY) + (hl2 ? Math.round(210 * scaleY) : Math.round(165 * scaleY));

  const topBarH = Math.round(120 * scaleY);
  const hl1Size = Math.round((hl2 ? 64 : 72) * scale);
  const hl2Size = Math.round(64 * scale);
  const subSize = Math.round(22 * scale);
  const bodySize = Math.round(18 * scale);
  const hasContact =
    (brandKit.phoneNumber && brandKit.phoneNumber.trim()) ||
    (brandKit.contactLocation && brandKit.contactLocation.trim()) ||
    (brandKit.website && brandKit.website.trim());
  const contactParts: string[] = [];
  if (brandKit.phoneNumber?.trim()) contactParts.push(brandKit.phoneNumber.trim());
  if (brandKit.contactLocation?.trim()) contactParts.push(brandKit.contactLocation.trim());
  if (brandKit.website?.trim()) contactParts.push(brandKit.website.trim());
  const contactLine = contactParts.join("  •  ");
  const contactY = hasContact ? H - Math.round(50 * scaleY) : 0;
  const hashtagY = hasContact ? H - Math.round(75 * scaleY) : H - Math.round(30 * scaleY);
  const ctaY = H - Math.round(hasContact ? 160 : 130 * scaleY);
  const ctaH = Math.round(48 * scaleY);

  const svg = `
<svg width="${W}" height="${H}"
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

  <rect x="0" y="0" width="${W}" height="${topBarH}"
        fill="url(#topGrad)" />

  <text
    x="${PADDING}"
    y="${Math.round(56 * scaleY)}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="${Math.round(22 * scale)}"
    letter-spacing="3"
    fill="${primary}"
  >${brandName.toUpperCase()}</text>

  <circle cx="${PADDING + brandName.length * Math.round(13 * scale) + Math.round(8 * scale)}" cy="${Math.round(50 * scaleY)}"
          r="${Math.round(4 * scale)}" fill="${primary}" opacity="0.6" />

  <rect x="0" y="${panelY}" width="${W}"
        height="${panelHeight + 10}"
        fill="url(#panelGrad)" />

  <rect x="${PADDING}" y="${panelY + Math.round(40 * scaleY)}"
        width="${Math.round(48 * scale)}" height="${Math.round(4 * scale)}"
        rx="${Math.round(2 * scale)}" fill="${primary}" />

  <text
    x="${PADDING}"
    y="${panelY + Math.round(80 * scaleY)}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="900"
    font-size="${hl1Size}"
    fill="#FFFFFF"
    letter-spacing="-1"
  >${hl1}</text>

  ${hl2 ? `
  <text
    x="${PADDING}"
    y="${panelY + Math.round(150 * scaleY)}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="900"
    font-size="${hl2Size}"
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
    font-size="${subSize}"
    fill="rgba(255,255,255,0.75)"
    letter-spacing="0.3"
  >${subheadline}</text>
  ` : ""}

  ${bl1 ? `
  <text
    x="${PADDING}"
    y="${bodyY1}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${bodySize}"
    fill="rgba(255,255,255,0.6)"
    letter-spacing="0.2"
  >${bl1}</text>
  ` : ""}
  ${bl2 ? `
  <text
    x="${PADDING}"
    y="${bodyY2}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${bodySize}"
    fill="rgba(255,255,255,0.6)"
  >${bl2}</text>
  ` : ""}

  <rect
    x="${PADDING}"
    y="${ctaY}"
    width="${Math.min(cta.length * Math.round(14 * scale) + Math.round(48 * scale), W - PADDING * 2)}"
    height="${ctaH}"
    rx="${Math.round(8 * scale)}"
    fill="${primary}"
  />
  <text
    x="${PADDING + Math.round(24 * scale)}"
    y="${ctaY + Math.round(ctaH / 2)}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="${Math.round(18 * scale)}"
    fill="${secondary}"
    dominant-baseline="middle"
  >${cta}</text>

  ${hashtags ? `
  <text
    x="${PADDING}"
    y="${hashtagY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${Math.round(14 * scale)}"
    fill="${primary}"
    opacity="0.5"
    letter-spacing="0.5"
  >${hashtags}</text>
  ` : ""}
  ${hasContact && contactLine ? `
  <text
    x="${W / 2}"
    y="${contactY}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${Math.round(12 * scale)}"
    fill="${primary}"
    opacity="0.7"
  >${escapeXml(contactLine)}</text>
  ` : ""}
</svg>`;

  const svgBuffer = Buffer.from(svg);

  const fullOverlayInputs: sharp.OverlayOptions[] = [
    { input: svgBuffer, top: 0, left: 0 },
  ];

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
