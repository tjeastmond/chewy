import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import { describe, expect, test } from 'vitest'

describe('bin/chewy', () => {
  test('prints help output for -h', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'chewy-'))
    const src = await readFile(path.resolve(process.cwd(), 'bin/chewy'), 'utf8')

    const tmpBin = path.join(tmp, 'chewy.mjs')
    await writeFile(tmpBin, src, 'utf8')

    const res = spawnSync(process.execPath, [tmpBin, '-h'], { encoding: 'utf8' })

    expect(res.status).toBe(0)
    expect(res.stdout).toMatch(/Usage: chewy \[options\]/)
    expect(res.stdout).toMatch(/chewy clean/)
    expect(res.stdout).toMatch(/--input/)
    expect(res.stdout).toMatch(/--format/)
  })

  test('prints a helpful message if dist output is missing', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'chewy-'))
    const src = await readFile(path.resolve(process.cwd(), 'bin/chewy'), 'utf8')

    const tmpBin = path.join(tmp, 'chewy.mjs')
    await writeFile(tmpBin, src, 'utf8')

    const res = spawnSync(process.execPath, [tmpBin], { encoding: 'utf8' })

    expect(res.status).not.toBe(0)
    expect(res.stderr).toMatch(/pnpm build/)
    expect(res.stderr).toMatch(/dist\/cli\.js/)
  })
})
