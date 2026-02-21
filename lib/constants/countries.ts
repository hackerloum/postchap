import type { CountryData } from "@/types";

export const COUNTRIES: CountryData[] = [
  // AFRICA
  { name: "Algeria", code: "DZ", continent: "Africa", timezone: "Africa/Algiers", currency: "DZD", languages: ["Arabic", "French", "Tamazight"] },
  { name: "Angola", code: "AO", continent: "Africa", timezone: "Africa/Luanda", currency: "AOA", languages: ["Portuguese"] },
  { name: "Botswana", code: "BW", continent: "Africa", timezone: "Africa/Gaborone", currency: "BWP", languages: ["English", "Setswana"] },
  { name: "Cameroon", code: "CM", continent: "Africa", timezone: "Africa/Douala", currency: "XAF", languages: ["French", "English"] },
  { name: "Côte d'Ivoire", code: "CI", continent: "Africa", timezone: "Africa/Abidjan", currency: "XOF", languages: ["French"] },
  { name: "DR Congo", code: "CD", continent: "Africa", timezone: "Africa/Kinshasa", currency: "CDF", languages: ["French", "Lingala", "Swahili"] },
  { name: "Egypt", code: "EG", continent: "Africa", timezone: "Africa/Cairo", currency: "EGP", languages: ["Arabic"] },
  { name: "Ethiopia", code: "ET", continent: "Africa", timezone: "Africa/Addis_Ababa", currency: "ETB", languages: ["Amharic", "Oromo", "Tigrinya"] },
  { name: "Ghana", code: "GH", continent: "Africa", timezone: "Africa/Accra", currency: "GHS", languages: ["English", "Twi", "Ga"] },
  { name: "Kenya", code: "KE", continent: "Africa", timezone: "Africa/Nairobi", currency: "KES", languages: ["English", "Swahili"] },
  { name: "Madagascar", code: "MG", continent: "Africa", timezone: "Indian/Antananarivo", currency: "MGA", languages: ["Malagasy", "French"] },
  { name: "Malawi", code: "MW", continent: "Africa", timezone: "Africa/Blantyre", currency: "MWK", languages: ["English", "Chichewa"] },
  { name: "Mali", code: "ML", continent: "Africa", timezone: "Africa/Bamako", currency: "XOF", languages: ["French", "Bambara"] },
  { name: "Morocco", code: "MA", continent: "Africa", timezone: "Africa/Casablanca", currency: "MAD", languages: ["Arabic", "French", "Tamazight"] },
  { name: "Mozambique", code: "MZ", continent: "Africa", timezone: "Africa/Maputo", currency: "MZN", languages: ["Portuguese"] },
  { name: "Namibia", code: "NA", continent: "Africa", timezone: "Africa/Windhoek", currency: "NAD", languages: ["English", "Afrikaans"] },
  { name: "Nigeria", code: "NG", continent: "Africa", timezone: "Africa/Lagos", currency: "NGN", languages: ["English", "Hausa", "Yoruba", "Igbo"] },
  { name: "Rwanda", code: "RW", continent: "Africa", timezone: "Africa/Kigali", currency: "RWF", languages: ["Kinyarwanda", "French", "English"] },
  { name: "Senegal", code: "SN", continent: "Africa", timezone: "Africa/Dakar", currency: "XOF", languages: ["French", "Wolof"] },
  { name: "Somalia", code: "SO", continent: "Africa", timezone: "Africa/Mogadishu", currency: "SOS", languages: ["Somali", "Arabic"] },
  { name: "South Africa", code: "ZA", continent: "Africa", timezone: "Africa/Johannesburg", currency: "ZAR", languages: ["Zulu", "Xhosa", "Afrikaans", "English"] },
  { name: "Sudan", code: "SD", continent: "Africa", timezone: "Africa/Khartoum", currency: "SDG", languages: ["Arabic", "English"] },
  { name: "Tanzania", code: "TZ", continent: "Africa", timezone: "Africa/Dar_es_Salaam", currency: "TZS", languages: ["Swahili", "English"] },
  { name: "Tunisia", code: "TN", continent: "Africa", timezone: "Africa/Tunis", currency: "TND", languages: ["Arabic", "French"] },
  { name: "Uganda", code: "UG", continent: "Africa", timezone: "Africa/Kampala", currency: "UGX", languages: ["English", "Swahili", "Luganda"] },
  { name: "Zambia", code: "ZM", continent: "Africa", timezone: "Africa/Lusaka", currency: "ZMW", languages: ["English", "Bemba", "Nyanja"] },
  { name: "Zimbabwe", code: "ZW", continent: "Africa", timezone: "Africa/Harare", currency: "ZWL", languages: ["English", "Shona", "Ndebele"] },
  // AMERICAS
  { name: "Brazil", code: "BR", continent: "Americas", timezone: "America/Sao_Paulo", currency: "BRL", languages: ["Portuguese"] },
  { name: "Canada", code: "CA", continent: "Americas", timezone: "America/Toronto", currency: "CAD", languages: ["English", "French"] },
  { name: "Colombia", code: "CO", continent: "Americas", timezone: "America/Bogota", currency: "COP", languages: ["Spanish"] },
  { name: "Mexico", code: "MX", continent: "Americas", timezone: "America/Mexico_City", currency: "MXN", languages: ["Spanish"] },
  { name: "United States", code: "US", continent: "Americas", timezone: "America/New_York", currency: "USD", languages: ["English"] },
  // ASIA PACIFIC
  { name: "Australia", code: "AU", continent: "Asia Pacific", timezone: "Australia/Sydney", currency: "AUD", languages: ["English"] },
  { name: "China", code: "CN", continent: "Asia Pacific", timezone: "Asia/Shanghai", currency: "CNY", languages: ["Mandarin"] },
  { name: "India", code: "IN", continent: "Asia Pacific", timezone: "Asia/Kolkata", currency: "INR", languages: ["Hindi", "English"] },
  { name: "Indonesia", code: "ID", continent: "Asia Pacific", timezone: "Asia/Jakarta", currency: "IDR", languages: ["Indonesian"] },
  { name: "Japan", code: "JP", continent: "Asia Pacific", timezone: "Asia/Tokyo", currency: "JPY", languages: ["Japanese"] },
  { name: "Singapore", code: "SG", continent: "Asia Pacific", timezone: "Asia/Singapore", currency: "SGD", languages: ["English", "Mandarin", "Malay", "Tamil"] },
  // EUROPE
  { name: "France", code: "FR", continent: "Europe", timezone: "Europe/Paris", currency: "EUR", languages: ["French"] },
  { name: "Germany", code: "DE", continent: "Europe", timezone: "Europe/Berlin", currency: "EUR", languages: ["German"] },
  { name: "Netherlands", code: "NL", continent: "Europe", timezone: "Europe/Amsterdam", currency: "EUR", languages: ["Dutch"] },
  { name: "United Kingdom", code: "GB", continent: "Europe", timezone: "Europe/London", currency: "GBP", languages: ["English"] },
  // MIDDLE EAST
  { name: "Saudi Arabia", code: "SA", continent: "Middle East", timezone: "Asia/Riyadh", currency: "SAR", languages: ["Arabic"] },
  { name: "UAE", code: "AE", continent: "Middle East", timezone: "Asia/Dubai", currency: "AED", languages: ["Arabic", "English"] },
];

export const CONTINENTS = [
  { id: "Africa", label: "Africa", emoji: "🌍" },
  { id: "Americas", label: "Americas", emoji: "🌎" },
  { id: "Asia Pacific", label: "Asia Pacific", emoji: "🌏" },
  { id: "Europe", label: "Europe", emoji: "🌐" },
  { id: "Middle East", label: "Middle East", emoji: "🌏" },
] as const;

/** Country codes that have Swahili in languages (for language options). */
export const SWAHILI_COUNTRY_CODES = new Set(["TZ", "KE", "UG", "RW", "CD"]);
