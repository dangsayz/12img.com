/**
 * Country to flag emoji mapping
 * Uses Unicode regional indicator symbols for native emoji flags
 */

// Map country names to ISO 3166-1 alpha-2 codes
const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Ireland': 'IE',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'India': 'IN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Singapore': 'SG',
  'United Arab Emirates': 'AE',
  'Portugal': 'PT',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Poland': 'PL',
  'Greece': 'GR',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Philippines': 'PH',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'China': 'CN',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Israel': 'IL',
  'Turkey': 'TR',
  'Saudi Arabia': 'SA',
  'Egypt': 'EG',
  'Nigeria': 'NG',
  'Kenya': 'KE',
  'Morocco': 'MA',
  'Russia': 'RU',
  'Ukraine': 'UA',
}

// Countries without specific flags
const NO_FLAG_COUNTRIES = ['Other']

/**
 * Convert ISO country code to flag emoji
 * Uses regional indicator symbols (🇺🇸 = U+1F1FA U+1F1F8)
 */
function countryCodeToFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

/**
 * Get flag emoji for a country name
 */
export function getCountryFlag(countryName: string | null | undefined): string | null {
  if (!countryName) return null
  if (NO_FLAG_COUNTRIES.includes(countryName)) return null
  const code = COUNTRY_CODES[countryName]
  if (!code) return null
  return countryCodeToFlag(code)
}

/**
 * Get country code for a country name
 */
export function getCountryCode(countryName: string | null | undefined): string | null {
  if (!countryName) return null
  return COUNTRY_CODES[countryName] || null
}

/**
 * Check if we have a flag for this country
 */
export function hasFlag(countryName: string | null | undefined): boolean {
  if (!countryName) return false
  if (NO_FLAG_COUNTRIES.includes(countryName)) return false
  return countryName in COUNTRY_CODES
}
