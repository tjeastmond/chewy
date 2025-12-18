import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

function findChromeExecutable(): string | null {
  const envPath = process.env.CHROME_PATH
  if (envPath && existsSync(envPath)) return envPath

  const candidates = [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]

  for (const c of candidates) {
    if (c.startsWith('/') && existsSync(c)) return c
    const res = spawnSync(c, ['--version'], { encoding: 'utf8' })
    if (res.status === 0) return c
  }

  return null
}

describe('bin/export-resume (pdf)', () => {
  const chrome = findChromeExecutable()
  const pdfTest = chrome ? test : test.skip

  pdfTest('writes a real PDF when pdf is requested', async () => {
    const build = spawnSync('pnpm', ['build'], { encoding: 'utf8' })
    expect(build.status).toBe(0)

    const input = path.resolve(process.cwd(), 'tjeastmond.json')
    const outRoot = path.resolve(process.cwd(), 'out')
    await mkdir(outRoot, { recursive: true })
    const tmp = await mkdtemp(path.join(outRoot, 'export-resume-pdf-'))

    const res = spawnSync(
      process.execPath,
      [path.resolve(process.cwd(), 'bin/export-resume'), '--input', input, '--format', 'pdf'],
      { encoding: 'utf8', cwd: tmp }
    )

    expect(res.status).toBe(0)
    expect(res.stderr).not.toMatch(/ERROR:/)

    const pdfPath = path.join(tmp, 'out', 'tjeastmond.pdf')
    expect(existsSync(pdfPath)).toBe(true)

    const bytes = await readFile(pdfPath)
    expect(bytes.subarray(0, 5).toString('utf8')).toBe('%PDF-')
    const tail = bytes.subarray(Math.max(0, bytes.length - 256)).toString('utf8')
    expect(tail).toMatch(/%%EOF\s*$/)
  })
})
