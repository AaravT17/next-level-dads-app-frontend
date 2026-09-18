import { describe, expect, it } from 'vitest'
import { formatChatListRelative, mailtoHref, telHref } from './format'

// Contact details come from whoever submitted the event and are never
// validated, so these two functions are the only thing between that input and
// an href the browser hands to a mail or dial handler.
describe('mailtoHref', () => {
  it('leaves an ordinary address untouched', () => {
    // The whole point of not using encodeURIComponent: `@` stays literal, so
    // handlers that do not decode percent-escapes still open the address.
    expect(mailtoHref('dad@example.com')).toBe('mailto:dad@example.com')
  })

  it('preserves the legal punctuation a local part may contain', () => {
    expect(mailtoHref("o'brien+tag@ex.co.uk")).toBe("mailto:o'brien+tag@ex.co.uk")
  })

  it('neutralises an appended header field', () => {
    expect(mailtoHref('a@b.com?bcc=evil@x.com')).toBe('mailto:a@b.com%3Fbcc=evil@x.com')
  })

  it('neutralises a second recipient smuggled in with a comma', () => {
    expect(mailtoHref('a@b.com,evil@x.com')).toBe('mailto:a@b.com%2Cevil@x.com')
  })

  it('neutralises a newline, which is what actually forges a header', () => {
    expect(mailtoHref('x\ny@b.com')).toBe('mailto:x%0Ay@b.com')
  })

  it('escapes a literal percent so an input cannot smuggle its own escape', () => {
    // Without this, `%0A` in the input would reach the handler as a newline.
    expect(mailtoHref('a@b.com%0ABcc:evil')).toBe('mailto:a@b.com%250ABcc:evil')
  })
})

describe('telHref', () => {
  it('keeps the characters a dial string can contain', () => {
    expect(telHref('+1 (555) 123-4567')).toBe('tel:+1 (555) 123-4567')
  })

  it('strips letters and anything else that cannot be dialled', () => {
    expect(telHref('+1-555-CALL-NOW')).toBe('tel:+1-555--')
  })

  it('strips newlines rather than treating them as whitespace', () => {
    expect(telHref('555\n1234')).toBe('tel:5551234')
  })
})

describe('formatChatListRelative', () => {
  it('uses day counts up to one week before falling back to a date', () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

    expect(formatChatListRelative(dayAgo.toISOString())).toBe('1d ago')
    expect(formatChatListRelative(threeDaysAgo.toISOString())).toBe('3d ago')
    expect(formatChatListRelative(eightDaysAgo.toISOString())).toBe(
      eightDaysAgo.toLocaleDateString(),
    )
  })
})
