import { spawnSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

describe('build', () => {
  test('pnpm build succeeds', () => {
    const res = spawnSync('pnpm', ['build'], { encoding: 'utf8' })
    expect(res.status).toBe(0)
  })
})

