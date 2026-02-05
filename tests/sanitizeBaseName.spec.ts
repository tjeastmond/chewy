import { describe, expect, test } from 'vitest'

import { sanitizeBaseName } from '../src/utils/sanitizeBaseName.js'

describe('sanitizeBaseName', () => {
  test('replaces path separators with dashes', () => {
    expect(sanitizeBaseName('foo/bar\\baz')).toBe('foo-bar-baz')
  })

  test('removes leading dots', () => {
    expect(sanitizeBaseName('...resume')).toBe('resume')
  })

  test('trims whitespace', () => {
    expect(sanitizeBaseName('  tjeastmond  ')).toBe('tjeastmond')
  })
})
