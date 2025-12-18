import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'

import { describe, expect, test } from 'vitest'

import { createResumeServer } from '../src/server.js'

async function listen(server: ReturnType<typeof createResumeServer>) {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const addr = server.address() as AddressInfo
  return { server, origin: `http://127.0.0.1:${addr.port}` }
}

async function close(server: ReturnType<typeof createResumeServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
}

describe('resume server', () => {
  test('serves HTML using resume.json when present', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'export-resume-server-'))
    const fixture = await readFile(path.resolve(process.cwd(), 'tjeastmond.json'), 'utf8')

    await writeFile(path.join(tmp, 'resume.json'), fixture, 'utf8')
    await writeFile(path.join(tmp, 'tjeastmond.json'), fixture, 'utf8')

    const { server, origin } = await listen(
      createResumeServer({ cwd: tmp, summaryKey: 'default', roleKey: 'staffplus' })
    )

    try {
      const res = await fetch(`${origin}/`)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/text\/html/)
      const html = await res.text()
      expect(html).toMatch(/TJ Eastmond/)
    } finally {
      await close(server)
    }
  })

  test('falls back to tjeastmond.json if resume.json is missing', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'export-resume-server-'))
    const fixture = await readFile(path.resolve(process.cwd(), 'tjeastmond.json'), 'utf8')
    await writeFile(path.join(tmp, 'tjeastmond.json'), fixture, 'utf8')

    const { server, origin } = await listen(
      createResumeServer({ cwd: tmp, summaryKey: 'default', roleKey: 'staffplus' })
    )

    try {
      const res = await fetch(`${origin}/`)
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toMatch(/TJ Eastmond/)
    } finally {
      await close(server)
    }
  })

  test('returns 404 for unknown routes', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'export-resume-server-'))
    const fixture = await readFile(path.resolve(process.cwd(), 'tjeastmond.json'), 'utf8')
    await writeFile(path.join(tmp, 'resume.json'), fixture, 'utf8')

    const { server, origin } = await listen(createResumeServer({ cwd: tmp }))

    try {
      const res = await fetch(`${origin}/nope`)
      expect(res.status).toBe(404)
    } finally {
      await close(server)
    }
  })
})
