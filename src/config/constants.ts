export const MIN_PASSWORD_LENGTH = 8

export const TIMEOUT_LENGTH_MS = 10000

export const MAX_BIO_LENGTH = 500

export const INTEREST_OPTIONS = [
  'Sports',
  'Cooking',
  'Outdoors',
  'Fitness',
  'Gaming',
  'Music',
  'Reading',
  'Travel',
  'Tech',
  'DIY',
  'Photography',
  'Art',
  'Cars',
  'Parenting',
  'Mental Wellness',
  'Movies',
  'Coffee',
  'Home Projects',
  'Volunteering',
  'Board Games',
  'Faith',
  'Entrepreneurship',
  'Pets',
  'Gardening',
  'Podcasts',
  'Finance',
  'Writing',
]

export const STAGE_OPTIONS = [
  { label: 'Expecting (pregnant/adopting)', value: 'Expecting' },
  { label: 'Newborn (0–1 year)', value: 'Newborn' },
  { label: 'Toddler (2–3 years)', value: 'Toddler' },
  { label: 'Preschool (4–5 years)', value: 'Preschool' },
  { label: 'Elementary (6–12 years)', value: 'Elementary' },
  { label: 'Teen (13–17 years)', value: 'Teen' },
  { label: 'Adult (18+ years)', value: 'Adult' },
]

export const STAGE_DISPLAY_MAP: Record<string, string> = Object.fromEntries(
  STAGE_OPTIONS.map(({ label, value }) => [value, label]),
)

export const PROVINCE_OPTIONS = [
  { label: 'Alberta', value: 'AB' },
  { label: 'British Columbia', value: 'BC' },
  { label: 'Manitoba', value: 'MB' },
  { label: 'New Brunswick', value: 'NB' },
  { label: 'Newfoundland and Labrador', value: 'NL' },
  { label: 'Northwest Territories', value: 'NT' },
  { label: 'Nova Scotia', value: 'NS' },
  { label: 'Nunavut', value: 'NU' },
  { label: 'Ontario', value: 'ON' },
  { label: 'Prince Edward Island', value: 'PE' },
  { label: 'Quebec', value: 'QC' },
  { label: 'Saskatchewan', value: 'SK' },
  { label: 'Yukon', value: 'YT' },
]

export const PROFILES_PAGE_LIMIT = 20
export const COMMUNITIES_PAGE_LIMIT = 20
export const CONVERSATIONS_PAGE_LIMIT = 10
export const MESSAGES_PAGE_LIMIT = 10
export const REPLIES_PAGE_LIMIT = 5
export const EVENTS_PAGE_LIMIT = 20

export const DISCOVER_DADS_FILTERS_AGE_RANGES = [
  'Under 25',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-59',
  '60+',
]
