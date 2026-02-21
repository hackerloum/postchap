/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji.
 * e.g. getFlagEmoji('KE') → '🇰🇪'
 */
export function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌐";
  const codePoints = code
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Get international dialing prefix for a country code.
 */
export function getPhoneCode(countryCode?: string): string {
  const codes: Record<string, string> = {
    TZ: "+255",
    KE: "+254",
    UG: "+256",
    RW: "+250",
    ET: "+251",
    NG: "+234",
    ZA: "+27",
    GH: "+233",
    EG: "+20",
    MA: "+212",
    SN: "+221",
    CI: "+225",
    CM: "+237",
    AO: "+244",
    MZ: "+258",
    ZM: "+260",
    ZW: "+263",
    SD: "+249",
    SO: "+252",
    BW: "+267",
    NA: "+264",
    MW: "+265",
    MG: "+261",
    ML: "+223",
    US: "+1",
    GB: "+44",
    FR: "+33",
    DE: "+49",
    IN: "+91",
    AE: "+971",
    SA: "+966",
    BR: "+55",
    DZ: "+213",
    CA: "+1",
    AU: "+61",
    CN: "+86",
    JP: "+81",
    SG: "+65",
    ID: "+62",
    CO: "+57",
    MX: "+52",
    NL: "+31",
  };
  return codes[countryCode ?? ""] ?? "+";
}
