import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { saveResumeBackup } from '../src/cli.js'

const createdDirs: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'chewy-cli-history-'))
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

describe('saveResumeBackup', () => {
  test('writes a timestamped backup using the resume file name', async () => {
    const dir = await makeTempDir()
    const fixture = await readFile(path.resolve(process.cwd(), 'tests/fixtures/test_resume.json'), 'utf8')
    const inputPath = path.join(dir, 'resume.json')
    const historyDir = path.join(dir, 'history')
    const now = new Date(2026, 1, 9, 10, 11, 12, 345)
    const timestamp = String(Math.floor(now.getTime() / 1000))

    await writeFile(inputPath, fixture, 'utf8')
    const backupPath = await saveResumeBackup(inputPath, fixture, { historyDir, now })

    expect(path.dirname(backupPath)).toBe(historyDir)
    expect(path.basename(backupPath)).toBe(`${timestamp}_resume.json`)

    const files = await readdir(historyDir)
    expect(files).toEqual([`${timestamp}_resume.json`])

    const written = await readFile(backupPath, 'utf8')
    expect(written).toBe(fixture)
  })
})
