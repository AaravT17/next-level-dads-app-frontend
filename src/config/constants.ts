export const MIN_PASSWORD_LENGTH = 8

export const TIMEOUT_LENGTH_MS = 10000

// --- Field limits ---
export const MAX_NAME_LENGTH = 100
export const MAX_CITY_LENGTH = 100
export const MAX_BIO_LENGTH = 500
export const MAX_ICEBREAKER_ANSWER_LENGTH = 250
export const MIN_INTERESTS = 3
export const MAX_INTERESTS = 7
export const MIN_ICEBREAKERS = 1
export const MAX_ICEBREAKERS = 3

// --- Interests (slug → display) ---
export const INTEREST_DISPLAY_MAP: Record<string, { label: string; emoji: string }> = {
  'sports': { label: 'Sports', emoji: '⚽' },
  'fitness': { label: 'Fitness', emoji: '💪' },
  'golf': { label: 'Golf', emoji: '⛳' },
  'outdoors': { label: 'Outdoors', emoji: '🏕️' },
  'gaming': { label: 'Gaming', emoji: '🎮' },
  'food': { label: 'Food & Cooking', emoji: '🍳' },
  'music': { label: 'Music', emoji: '🎵' },
  'movies-tv': { label: 'Movies & TV', emoji: '🎬' },
  'comedy': { label: 'Comedy & Standup', emoji: '😂' },
  'theatre': { label: 'Theatre', emoji: '🎭' },
  'true-crime': { label: 'True Crime', emoji: '🔍' },
  'travel': { label: 'Travel', emoji: '✈️' },
  'tech': { label: 'Tech', emoji: '💻' },
  'cars': { label: 'Cars', emoji: '🚗' },
  'reading': { label: 'Reading', emoji: '📚' },
  'photography': { label: 'Photography', emoji: '📷' },
  'podcasts': { label: 'Podcasts', emoji: '🎙️' },
  'art': { label: 'Art', emoji: '🎨' },
  'fashion': { label: 'Fashion', emoji: '👟' },
  'collectibles': { label: 'Collectibles', emoji: '🃏' },
  'history': { label: 'History', emoji: '🏛️' },
  'diy': { label: 'DIY & Home Projects', emoji: '🔨' },
  'board-games': { label: 'Board Games', emoji: '🎲' },
  'pets': { label: 'Pets', emoji: '🐾' },
  'gardening': { label: 'Gardening', emoji: '🌱' },
  'volunteering': { label: 'Volunteering', emoji: '🤝' },
  'finance': { label: 'Finance', emoji: '💰' },
  'entrepreneurship': { label: 'Entrepreneurship', emoji: '🚀' },
  'faith-spirituality': { label: 'Faith & Spirituality', emoji: '🙏' },
  'health-wellness': { label: 'Health & Wellness', emoji: '🧠' },
}

// --- Stages ---
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

// --- Provinces (QC removed) ---
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
  { label: 'Saskatchewan', value: 'SK' },
  { label: 'Yukon', value: 'YT' },
]

// --- Goals ---
export const GOAL_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'dad-friends', label: 'Make dad friends', hint: 'Meet dads I genuinely connect with' },
  { value: 'events', label: 'Events & meetups', hint: 'Find things to do and people to meet' },
  { value: 'playdates', label: 'Playdates & family time', hint: 'Connect with other families and kids' },
  { value: 'advice', label: 'Advice & support', hint: 'Talk with dads who get it' },
  { value: 'communities', label: 'Communities', hint: 'Groups around my interests or stage' },
  { value: 'resources', label: 'Parenting resources', hint: 'Useful information, when I need it' },
  { value: 'experts', label: 'Experts & workshops', hint: 'Learn from people who know their stuff' },
]

// --- Connection Styles ---
export const CONNECTION_STYLE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'close', label: 'Close friendships', hint: 'Genuine friendships that grow over time' },
  { value: 'casual', label: 'Casual friendships', hint: 'Coffee, food, the occasional hang' },
  { value: 'activity', label: 'Activity buddies', hint: 'Sports, gaming, workouts, projects' },
  { value: 'family', label: 'Family friendships', hint: 'Families who get to know each other' },
  { value: 'playdate', label: 'Playdate connections', hint: "Kids around mine's age" },
  { value: 'gets-it', label: 'Someone who gets it', hint: 'Honest, supportive conversations' },
]

// --- Match Priorities ---
export const MATCH_PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'nearby', label: 'Lives nearby' },
  { value: 'kid-ages', label: 'Kids around the same age' },
  { value: 'interests', label: 'Shared interests' },
  { value: 'connection-type', label: 'Same kind of connection' },
  { value: 'age', label: 'Around my age' },
  { value: 'no-preference', label: 'No strong preference' },
]

// --- Icebreaker Prompts ---
export const ICEBREAKER_PROMPTS: { slug: string; text: string }[] = [
  { slug: 'fatherhood-taught-me', text: 'Fatherhood has taught me...' },
  { slug: 'favourite-thing-with-kids', text: 'My favourite thing to do with my kids is...' },
  { slug: 'wish-id-known', text: "One thing I wish I'd known before becoming a dad..." },
  { slug: 'dad-skill', text: "The dad skill I'm most proud of is..." },
  { slug: 'hoping-to-meet', text: "I'm hoping to meet dads who..." },
  { slug: 'get-along-if', text: "We'll probably get along if..." },
  { slug: 'ideal-hangout', text: 'My ideal hangout is...' },
  { slug: 'always-down-to', text: "I'm always down to..." },
  { slug: 'life-goal', text: 'A life goal of mine is...' },
  { slug: 'ask-me-about', text: 'Ask me about...' },
  { slug: 'currently-obsessed', text: "I'm currently obsessed with..." },
  { slug: 'perfect-weekend', text: 'A perfect weekend looks like...' },
  { slug: 'want-to-learn', text: 'Something I want to learn this year is...' },
  { slug: 'wont-shut-up', text: "I won't shut up about..." },
  { slug: 'unpopular-opinion', text: 'My most unpopular opinion is...' },
  { slug: 'way-to-my-heart', text: 'The way to my heart is...' },
  { slug: 'dad-joke', text: 'My go-to dad joke is...' },
  { slug: 'weirdly-competitive', text: "I'm weirdly competitive about..." },
  { slug: 'hill-ill-die-on', text: "The hill I'll die on is..." },
  { slug: 'guilty-pleasure', text: 'My guilty pleasure is...' },
  { slug: 'dream-dinner-guest', text: 'My dream dinner guest is...' },
  { slug: 'settle-this', text: 'Let\'s settle this once and for all...' },
  { slug: 'dream-travel-destination', text: 'My dream travel destination is...' },
  { slug: 'bucket-list', text: 'One thing on my bucket list is...' },
  { slug: 'party-story', text: 'My go-to story at a party is...' },
  { slug: 'fun-fact', text: 'A fun fact about me is...' },
  { slug: 'proudest-achievement', text: 'My proudest achievement is...' },
  { slug: 'two-truths-and-a-lie', text: 'Two truths and a lie...' },
  { slug: 'biggest-pet-peeve', text: 'My biggest pet peeve is...' },
  { slug: 'random-fact-i-love', text: 'A random fact I love is...' },
  { slug: 'favourite-quote', text: 'My favourite quote is...' },
  { slug: 'dad-stereotype', text: 'The dad stereotype that fits me perfectly is...' },
]

// --- Pagination ---
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
 * Whether anyone can set or change a community's photo from the UI.
 *
 * Off: no user, admins included, is offered the control. Photos still render
 * wherever a community has one, and the whole upload path -- the API client,
 * the mutation hooks, the editor component and the backend endpoints -- is left
 * in place and working, so turning this back on is the only change needed.
 *
 * Typed as `boolean` rather than inferred as `false` so the gated branches stay
 * type-checked instead of being narrowed away as dead code.
 */
export const COMMUNITY_PHOTO_EDITING_ENABLED: boolean = false

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

// --- Discover Filters ---
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
