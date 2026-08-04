import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { clearOutDir } from '../src/utils/clearOutDir.js'

const createdDirs: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'chewy-clear-out-'))
  createdDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(
    createdDirs.splice(0, createdDirs.length).map(async (dir) => {
      await rm(dir, { recursive: true, force: true })
    }),
  )
})

describe('clearOutDir', () => {
  test('removes all files and nested directories inside outDir', async () => {
    const dir = await makeTempDir()
    const outDir = path.join(dir, 'out')
    await mkdir(path.join(outDir, 'nested'), { recursive: true })
    await writeFile(path.join(outDir, 'resume.html'), '<html></html>', 'utf8')
    await writeFile(path.join(outDir, 'resume.pdf'), 'pdf', 'utf8')
    await writeFile(path.join(outDir, 'nested', 'extra.txt'), 'extra', 'utf8')

    const removed = await clearOutDir(outDir)

    expect(removed.sort()).toEqual(
      [path.join(outDir, 'nested'), path.join(outDir, 'resume.html'), path.join(outDir, 'resume.pdf')].sort(),
    )
    expect(await readdir(outDir)).toEqual([])
  })

  test('returns an empty list when outDir does not exist', async () => {
    const dir = await makeTempDir()
    const missing = path.join(dir, 'does-not-exist')

    const removed = await clearOutDir(missing)

    expect(removed).toEqual([])
  })

  test('returns an empty list when outDir is already empty', async () => {
    const dir = await makeTempDir()
    const outDir = path.join(dir, 'out')
    await mkdir(outDir, { recursive: true })

    const removed = await clearOutDir(outDir)

    expect(removed).toEqual([])
    expect(await readdir(outDir)).toEqual([])
  })
})
