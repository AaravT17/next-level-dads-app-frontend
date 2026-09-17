import { describe, expect, it } from 'vitest'
import { COMMUNITY_TILE_GRADIENTS, communityTileGradient } from './communityTile'

/**
 * The tile is derived, never stored, which puts the whole contract in this
 * function: the same name has to produce the same colour on every device, for
 * every viewer, today and next year. Nothing else enforces that — there is no
 * column to compare against and no request that would fail.
 */

const NAMES = [
  'Toronto Dads',
  'New Dads Support',
  'Weekend Warriors',
  'Hockey Dads',
  'Single Dads',
  'Cooking with Kids',
  'Dads of Teens',
  'Night Shift Dads',
]

describe('stability', () => {
  it('gives the same name the same tile every time', () => {
    for (const name of NAMES) {
      expect(communityTileGradient(name)).toBe(communityTileGradient(name))
    }
  })

  it('pins known names to known tiles', () => {
    // Change-detector on purpose. These are the values already on people's
    // screens; if an edit to the hash moves them, every community silently
    // changes colour and this is the only thing that would say so.
    expect(communityTileGradient('Toronto Dads')).toBe(COMMUNITY_TILE_GRADIENTS[0])
    expect(communityTileGradient('Night Shift Dads')).toBe(COMMUNITY_TILE_GRADIENTS[1])
    expect(communityTileGradient('Hockey Dads')).toBe(COMMUNITY_TILE_GRADIENTS[2])
    expect(communityTileGradient('Dads of Teens')).toBe(COMMUNITY_TILE_GRADIENTS[3])
    expect(communityTileGradient('Cooking with Kids')).toBe(COMMUNITY_TILE_GRADIENTS[4])
    expect(communityTileGradient('Weekend Warriors')).toBe(COMMUNITY_TILE_GRADIENTS[5])
  })

  it('treats a rename as a different community', () => {
    // Documented trade: keying on the name is what lets the create dialog
    // preview the real tile before an id exists.
    expect(communityTileGradient('Toronto Dads')).not.toBe(
      communityTileGradient('Toronto Dads Club'),
    )
  })
})

describe('the output', () => {
  it('is always one of the palette', () => {
    for (const name of NAMES) {
      expect(COMMUNITY_TILE_GRADIENTS).toContain(communityTileGradient(name))
    }
  })

  it('answers for names that are empty, missing, or exotic', () => {
    // The create dialog calls this on every keystroke, starting from ''.
    for (const value of ['', null, undefined, ' ', '🍳', 'Dads'.repeat(500)]) {
      expect(COMMUNITY_TILE_GRADIENTS).toContain(communityTileGradient(value))
    }
  })

  it('stays inside the palette for a long name, where the hash overflows', () => {
    // djb2 runs past int32 within a few characters; the sign bit is masked off
    // rather than negated, since one int32 value negates to itself and would
    // otherwise index backwards off the array.
    for (let length = 1; length < 400; length += 7) {
      const gradient = communityTileGradient('d'.repeat(length))
      expect(COMMUNITY_TILE_GRADIENTS).toContain(gradient)
    }
  })
})

describe('the palette', () => {
  it('offers enough colours to tell a list apart', () => {
    expect(COMMUNITY_TILE_GRADIENTS.length).toBeGreaterThanOrEqual(5)
  })

  it('holds no duplicates', () => {
    expect(new Set(COMMUNITY_TILE_GRADIENTS).size).toBe(COMMUNITY_TILE_GRADIENTS.length)
  })

  it('spreads a realistic set of names across most of it', () => {
    // Six colours and eight names will collide somewhere; what matters is that
    // the hash does not pile them onto one or two tiles, which is how a list
    // would end up looking uniform again.
    const used = new Set(NAMES.map(communityTileGradient))
    expect(used.size).toBeGreaterThanOrEqual(4)
  })
})
