import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { findDefaultInput } from '../src/cli.js'

const createdDirs: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'chewy-cli-default-'))
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

describe('findDefaultInput', () => {
  test('uses ./resume.json when present', async () => {
    const dir = await makeTempDir()
    const fixture = await readFile(path.resolve(process.cwd(), 'tests/fixtures/test_resume.json'), 'utf8')

    await writeFile(path.join(dir, 'resume.json'), fixture, 'utf8')
    await writeFile(path.join(dir, 'a.json'), fixture, 'utf8')

    const found = await findDefaultInput(dir)

    expect(found).toBe(path.join(dir, 'resume.json'))
  })

  test('falls back to first schema-valid JSON file when resume.json is missing', async () => {
    const dir = await makeTempDir()
    const fixture = await readFile(path.resolve(process.cwd(), 'tests/fixtures/test_resume.json'), 'utf8')

    await writeFile(path.join(dir, 'a-invalid.json'), JSON.stringify({ foo: 'bar' }), 'utf8')
    await writeFile(path.join(dir, 'b-valid.json'), fixture, 'utf8')
    await writeFile(path.join(dir, 'c-valid.json'), fixture, 'utf8')

    const found = await findDefaultInput(dir)

    expect(found).toBe(path.join(dir, 'b-valid.json'))
  })

  test('throws when no schema-valid JSON file exists', async () => {
    const dir = await makeTempDir()

    await writeFile(path.join(dir, 'a.json'), JSON.stringify({ foo: 'bar' }), 'utf8')
    await writeFile(path.join(dir, 'notes.txt'), 'not json', 'utf8')

    await expect(findDefaultInput(dir)).rejects.toThrow(/schema-valid JSON file/)
  })
})
