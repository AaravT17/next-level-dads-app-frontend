// Deep ESM imports, not `import validator from 'validator'`. The package's
// entry point is a CommonJS barrel that re-exports every validator it ships --
// IBAN, credit cards, the locale tables -- and none of it tree-shakes, so the
// default import cost 42.7 kB gzipped (13% of the bundle) to call two
// functions. These two modules cost a fraction of that.
import isEmailValidator from 'validator/es/lib/isEmail'
import isStrongPasswordValidator from 'validator/es/lib/isStrongPassword'
import { MIN_PASSWORD_LENGTH } from '@/config/constants'

export const isStrongPassword = (password: string): boolean => {
  return isStrongPasswordValidator(password, {
    minLength: MIN_PASSWORD_LENGTH,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
}

/**
 * Whether an address is well-formed enough to be worth submitting.
 *
 * The server validates too — this only exists to fail the obvious cases before
 * a round trip. Callers pass the trimmed value, since that is what gets sent.
 */
export const isValidEmail = (email: string): boolean => isEmailValidator(email)
