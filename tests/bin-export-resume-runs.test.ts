import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

describe('bin/export-resume (built)', () => {
  function hasPdfRenderer(): boolean {
    const envPath = process.env.CHROME_PATH
    if (envPath && existsSync(envPath)) return true

    const candidates = [
      'google-chrome',
      'chromium',
      'chromium-browser',
      'google-chrome-stable',
      // macOS default install location
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ]

    for (const c of candidates) {
      if (c.startsWith('/') && existsSync(c)) return true
      const res = spawnSync(c, ['--version'], { encoding: 'utf8' })
      if (res.status === 0) return true
    }

    return false
  }

  test('runs the CLI and writes output files', { timeout: 30_000 }, async () => {
    const build = spawnSync('pnpm', ['build'], { encoding: 'utf8' })
    expect(build.status).toBe(0)

    const input = path.resolve(process.cwd(), 'tjeastmond.json')
    const outRoot = path.resolve(process.cwd(), 'out')
    await mkdir(outRoot, { recursive: true })

    {
      const cwdDir = await mkdtemp(path.join(outRoot, 'export-resume-cwd-default-out-'))
      await copyFile(input, path.join(cwdDir, 'tjeastmond.json'))

      const res = spawnSync(
        process.execPath,
        [
          path.resolve(process.cwd(), 'bin/export-resume'),
          '--input',
          'tjeastmond.json',
          '--format',
          'txt',
        ],
        { encoding: 'utf8', cwd: cwdDir }
      )

      expect(res.status).toBe(0)
      expect(res.stderr).not.toMatch(/ERROR:/)
      expect(existsSync(path.join(cwdDir, 'out', 'tjeastmond.txt'))).toBe(true)
    }

    {
      const outDir = await mkdtemp(path.join(outRoot, 'export-resume-out-txt-'))
      const res = spawnSync(
        process.execPath,
        [
          path.resolve(process.cwd(), 'bin/export-resume'),
          '--input',
          input,
          '--out-dir',
          outDir,
          '--format',
          'txt',
        ],
        { encoding: 'utf8' }
      )

      expect(res.status).toBe(0)
      expect(res.stderr).not.toMatch(/ERROR:/)
      expect(existsSync(path.join(outDir, 'tjeastmond.txt'))).toBe(true)
    }

    {
      const outDir = await mkdtemp(path.join(outRoot, 'export-resume-out-html-'))
      const res = spawnSync(
        process.execPath,
        [
          path.resolve(process.cwd(), 'bin/export-resume'),
          '--input',
          input,
          '--out-dir',
          outDir,
          '--format',
          'html',
        ],
        { encoding: 'utf8' }
      )

      expect(res.status).toBe(0)
      expect(res.stderr).not.toMatch(/ERROR:/)
      expect(existsSync(path.join(outDir, 'tjeastmond.html'))).toBe(true)
    }

    {
      const outDir = await mkdtemp(path.join(outRoot, 'export-resume-out-pdf-'))
      const res = spawnSync(
        process.execPath,
        [
          path.resolve(process.cwd(), 'bin/export-resume'),
          '--input',
          input,
          '--out-dir',
          outDir,
          '--format',
          'pdf',
        ],
        { encoding: 'utf8' }
      )

      const pdfPath = path.join(outDir, 'tjeastmond.pdf')

      if (hasPdfRenderer()) {
        expect(res.status).toBe(0)
        expect(res.stderr).not.toMatch(/ERROR:/)
        expect(existsSync(pdfPath)).toBe(true)

        const pdf = await readFile(pdfPath)
        expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
      } else {
        expect(res.status).not.toBe(0)
        expect(res.stderr).toMatch(/PDF export requires/i)
        expect(existsSync(pdfPath)).toBe(false)
      }
    }
  })
})
