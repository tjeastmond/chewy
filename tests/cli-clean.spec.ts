import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { runCli } from '../src/cli.js'

const createdDirs: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'chewy-cli-clean-'))
  createdDirs.push(dir)
  return dir
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    createdDirs.splice(0, createdDirs.length).map(async (dir) => {
      await rm(dir, { recursive: true, force: true })
    }),
  )
})

describe('runCli clean', () => {
  test('removes all files in the default out directory', async () => {
    const dir = await makeTempDir()
    const outDir = path.join(dir, 'out')
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'resume.html'), '<html></html>', 'utf8')
    await writeFile(path.join(outDir, 'resume.txt'), 'text', 'utf8')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir)
    const stdout: string[] = []
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout.push(String(chunk))
      return true
    })

    await runCli(['clean'])

    cwdSpy.mockRestore()
    writeSpy.mockRestore()

    expect(await readdir(outDir)).toEqual([])
    expect(stdout.join('')).toMatch(/Cleared 2 item\(s\)/)
  })

  test('respects --out-dir', async () => {
    const dir = await makeTempDir()
    const outDir = path.join(dir, 'custom-out')
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'resume.json'), '{}', 'utf8')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir)
    const stdout: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout.push(String(chunk))
      return true
    })

    await runCli(['clean', '--out-dir', 'custom-out'])

    cwdSpy.mockRestore()

    expect(await readdir(outDir)).toEqual([])
    expect(stdout.join('')).toMatch(/Cleared 1 item\(s\)/)
  })

  test('reports when there is nothing to clean', async () => {
    const dir = await makeTempDir()

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir)
    const stdout: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout.push(String(chunk))
      return true
    })

    await runCli(['clean'])

    cwdSpy.mockRestore()

    expect(stdout.join('')).toMatch(/Nothing to clean/)
  })
})
