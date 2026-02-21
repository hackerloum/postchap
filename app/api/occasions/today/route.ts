import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/occasions/today?country=KE&timezone=Africa/Nairobi&continent=Africa
 * Returns occasions relevant to the brand's location (no hardcoded Tanzania).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "Global";
  const timezone = searchParams.get("timezone") || "UTC";
  const continent = searchParams.get("continent") || "Global";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI not configured", occasions: [] },
      { status: 200 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are an expert on holidays, occasions, and culturally relevant events for businesses worldwide.

Given today's date and the business location below, identify any occasions happening today or within the next 3 days that a business there might want to create marketing content for.

Business location:
Country: ${country}
Continent: ${continent}
Timezone: ${timezone}

Consider ALL of the following that are relevant to this location:
- Religious holidays for ALL major religions (Islam, Christianity, Hinduism, Judaism, Buddhism, etc.)
- National public holidays for ${country}
- Regional holidays relevant to ${continent}
- Global awareness days (World Health Day, Earth Day, etc.)
- Popular secular events (Valentine's Day, Mother's Day, etc.)
- Important local cultural events

Be specific and accurate. Only return occasions genuinely relevant to a business in ${country}.

Return JSON array:
[
  {
    "name": "Occasion name",
    "category": "religious_holiday|national_holiday|...",
    "date": "YYYY-MM-DD",
    "description": "Brief description relevant to ${country}",
    "visualMood": "mood words",
    "colorSuggestion": ["#hex1", "#hex2", "#hex3"],
    "messagingTone": "tone description",
    "relevantCountries": ["${country}"] or ["Global"]
  }
]

If no occasions today or in next 3 days: return [].
Return ONLY valid JSON.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Today's date: ${today}. Return occasions as JSON array.` },
        ],
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "OpenAI request failed", occasions: [] },
        { status: 200 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "[]";
    const parsed = JSON.parse(raw) as unknown[];
    return NextResponse.json({ occasions: parsed });
  } catch {
    return NextResponse.json({ occasions: [] });
  }
}
