import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

describe('bin/export-resume (built)', () => {
  test('runs the CLI and writes output files', async () => {
    const build = spawnSync('pnpm', ['build'], { encoding: 'utf8' })
    expect(build.status).toBe(0)

    const input = path.resolve(process.cwd(), 'tjeastmond.json')
    const outRoot = path.resolve(process.cwd(), 'out')
    await mkdir(outRoot, { recursive: true })

    {
      const tmp = await mkdtemp(path.join(outRoot, 'export-resume-default-out-dir-'))
      const res = spawnSync(
        process.execPath,
        [path.resolve(process.cwd(), 'bin/export-resume'), '--input', input, '--format', 'txt'],
        { encoding: 'utf8', cwd: tmp }
      )

      expect(res.status).toBe(0)
      expect(res.stderr).not.toMatch(/ERROR:/)
      expect(existsSync(path.join(tmp, 'out', 'tjeastmond.txt'))).toBe(true)
    }

    {
      const tmp = await mkdtemp(path.join(outRoot, 'export-resume-out-missing-dir-'))
      const outDir = path.join(tmp, 'nested', 'out')

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
  })
})
