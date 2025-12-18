import { describe, expect, test } from 'vitest'

import { JobTrackerSchema } from '../src/validators/jobTrackerFromJsonSchema.js'

describe('json-schema.json -> zod', () => {
  test('builds a working validator for at least one schema variant', () => {
    // One of the schema variants is "User Create Input (Admin)" which requires only email.
    const parsed = JobTrackerSchema.safeParse({ email: 'test@example.com' })
    expect(parsed.success).toBe(true)
  })
})
