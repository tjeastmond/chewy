import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

describe('json-schema.json', () => {
  test('is valid JSON and has basic schema metadata', async () => {
    const raw = await readFile(path.resolve(process.cwd(), 'json-schema.json'), 'utf8')
    const json = JSON.parse(raw) as Record<string, unknown>

    expect(json.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(json.title).toBeTruthy()
    expect(json.type).toBe('object')
  })
})
