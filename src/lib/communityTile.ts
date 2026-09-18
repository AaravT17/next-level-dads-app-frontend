/**
 * The tile a community gets when it has no photo.
 *
 * The old fallback was one grey glyph, which is fine for a single card and
 * useless for a list: a Groups page full of new communities was a column of
 * identical grey squares, and the photo slot did nothing but take up room. A
 * tile keyed to the name gives every community a mark of its own, so a list
 * can be scanned by shape and colour before any of the words are read.
 *
 * Derived, not stored. There is no column for it and no request to make — the
 * same name always lands on the same colour, on every device and for every
 * viewer, which is what makes it recognisable in the first place.
 */

/**
 * Six gradients, mid-tone and muted so they sit beside the gold rather than
 * competing with it. Each one is dark enough that white initials clear 4.5:1
 * at *both* ends of the gradient, not just the average, so the monogram is
 * readable wherever it happens to fall.
 *
 * Fixed colours rather than theme tokens: this is the community's identity and
 * should not change out from under someone who switches theme, and each tile
 * brings its own contrast so it needs nothing from the surface behind it.
 */
export const COMMUNITY_TILE_GRADIENTS = [
  'linear-gradient(145deg, hsl(38 48% 38%), hsl(38 48% 29%))',
  'linear-gradient(145deg, hsl(14 45% 47%), hsl(14 45% 38%))',
  'linear-gradient(145deg, hsl(142 24% 39%), hsl(142 24% 30%))',
  'linear-gradient(145deg, hsl(214 32% 48%), hsl(214 32% 39%))',
  'linear-gradient(145deg, hsl(288 24% 50%), hsl(288 24% 41%))',
  'linear-gradient(145deg, hsl(189 38% 38%), hsl(189 38% 29%))',
] as const

/**
 * djb2. Chosen for being stable and boring: the point is that a given name
 * lands on the same tile in this session, in next year's session, and on
 * somebody else's phone, so the function must never change once names are in
 * the wild.
 *
 * `| 0` keeps it inside int32 rather than drifting into float territory as the
 * string gets longer, which is what would make it depend on precision.
 */
function hash(value: string): number {
  let h = 5381
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0
  }
  return h
}

/**
 * The gradient for a community name.
 *
 * Keyed on the name rather than the id so the create dialog can preview the
 * real tile while it is still being typed, before any id exists. A rename
 * moves a community to a different colour, which is the right trade: renames
 * are rare, and a preview that lies about what you are about to make is worse
 * than one that shifts if you later change your mind.
 */
export function communityTileGradient(name: string | null | undefined): string {
  // Math.abs would overflow on the single int32 value whose negation is itself;
  // masking off the sign bit cannot.
  const index = (hash(name ?? '') & 0x7fffffff) % COMMUNITY_TILE_GRADIENTS.length
  return COMMUNITY_TILE_GRADIENTS[index]
}
