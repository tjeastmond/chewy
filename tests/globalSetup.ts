import { rm } from 'node:fs/promises'
import path from 'node:path'

export default async function globalSetup() {
  const outRoot = path.resolve(process.cwd(), 'out')

  // Clean before to ensure a deterministic starting state
  await rm(outRoot, { recursive: true, force: true })

  // Clean after to ensure tests leave no output behind
  return async () => {
    await rm(outRoot, { recursive: true, force: true })
  }
}

