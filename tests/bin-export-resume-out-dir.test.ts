import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

describe('bin/export-resume creates --out-dir (wrapper behavior)', () => {
  test('creates missing --out-dir before calling dist/cli.js', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'export-resume-bin-outdir-'))
    await mkdir(path.join(tmp, 'bin'), { recursive: true })
    await mkdir(path.join(tmp, 'dist'), { recursive: true })

    const src = await readFile(path.resolve(process.cwd(), 'bin/export-resume'), 'utf8')
    await writeFile(path.join(tmp, 'bin', 'export-resume.mjs'), src, 'utf8')

    // Fake dist/cli.js that tries to write into --out-dir without creating directories.
    // If the wrapper doesn't pre-create the directory, this will throw and the process will exit non-zero.
    await writeFile(
      path.join(tmp, 'dist', 'cli.js'),
      [
        "import { writeFileSync } from 'node:fs'",
        "import path from 'node:path'",
        '',
        'function parseOutDir(argv) {',
        "  const long = argv.indexOf('--out-dir')",
        "  const short = argv.indexOf('-o')",
        '  const i = long !== -1 ? long : short',
        '  if (i === -1) return undefined',
        '  return argv[i + 1]',
        '}',
        '',
        'export function runCli(argv = process.argv.slice(2)) {',
        "  const outDir = parseOutDir(argv) ?? '.'",
        "  const p = path.resolve(process.cwd(), outDir, 'sentinel.txt')",
        "  writeFileSync(p, 'ok', 'utf8')",
        '}',
        '',
      ].join('\n'),
      'utf8'
    )

    const outDir = path.join(tmp, 'nested', 'out')
    const res = spawnSync(process.execPath, [path.join(tmp, 'bin', 'export-resume.mjs'), '--out-dir', outDir], {
      encoding: 'utf8',
    })

    expect(res.status).toBe(0)
    expect(existsSync(path.join(outDir, 'sentinel.txt'))).toBe(true)
  })

  test('defaults to ./out and creates it before calling dist/cli.js', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'export-resume-bin-default-outdir-'))
    await mkdir(path.join(tmp, 'bin'), { recursive: true })
    await mkdir(path.join(tmp, 'dist'), { recursive: true })

    const src = await readFile(path.resolve(process.cwd(), 'bin/export-resume'), 'utf8')
    await writeFile(path.join(tmp, 'bin', 'export-resume.mjs'), src, 'utf8')

    // Fake dist/cli.js that tries to write into the default ./out without creating directories.
    await writeFile(
      path.join(tmp, 'dist', 'cli.js'),
      [
        "import { writeFileSync } from 'node:fs'",
        "import path from 'node:path'",
        '',
        'export function runCli(argv = process.argv.slice(2)) {',
        "  if (argv.includes('--out-dir') || argv.includes('-o')) throw new Error('unexpected out-dir flag in test')",
        "  const p = path.resolve(process.cwd(), 'out', 'sentinel.txt')",
        "  writeFileSync(p, 'ok', 'utf8')",
        '}',
        '',
      ].join('\n'),
      'utf8'
    )

    const res = spawnSync(process.execPath, [path.join(tmp, 'bin', 'export-resume.mjs')], {
      encoding: 'utf8',
      cwd: tmp,
    })

    expect(res.status).toBe(0)
    expect(existsSync(path.join(tmp, 'out', 'sentinel.txt'))).toBe(true)
  })
})
