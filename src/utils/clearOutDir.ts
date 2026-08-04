import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'

/**
 * Removes all files and subdirectories inside `outDir`, leaving the directory itself.
 * Returns the absolute paths that were removed. Missing directories are a no-op.
 */
export async function clearOutDir(outDir: string): Promise<string[]> {
  const resolved = path.resolve(outDir)

  let entries: string[]
  try {
    entries = await readdir(resolved)
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code === 'ENOENT') return []
    throw e
  }

  const removed: string[] = []
  for (const entry of entries) {
    const full = path.join(resolved, entry)
    await rm(full, { recursive: true, force: true })
    removed.push(full)
  }

  return removed
}
