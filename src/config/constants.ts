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
export const CONVERSATION_MESSAGES_PAGE_LIMIT = 10
export const REPLIES_PAGE_LIMIT = 5
export const EVENTS_PAGE_LIMIT = 20
export const CHATS_PAGE_LIMIT = 20
export const MESSAGES_PAGE_LIMIT = 50
export const PARTICIPANTS_PAGE_LIMIT = 20

/** How many "get back into it" cards the Home rail asks for. */
export const RESUME_PAGE_LIMIT = 10

/**
 * Feed suggestion cadence: one suggestion card after every Nth post.
 *
 * Four keeps suggestions discoverable without the feed reading as promotional.
 * The interleave is a pure function of this number, so tuning it is a one-line
 * change with no layout work.
 */
export const FEED_SUGGESTION_INTERVAL = 4

/** How many of each suggestion kind to hold, so the feed can scroll a while. */
export const FEED_SUGGESTION_POOL_SIZE = 6

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
