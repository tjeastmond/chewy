import type { AddressInfo } from 'node:net'

import { createResumeServer } from './server.js'

type ServeArgs = {
  host: string
  port: number
  input?: string
  summaryKey: string
  roleKey: string
  template?: string
}

function parseArgs(argv: string[]): ServeArgs {
  const args: ServeArgs = {
    host: '127.0.0.1',
    port: 3000,
    summaryKey: 'default',
    roleKey: 'staffplus',
  }

  const readValue = (i: number) => {
    const v = argv[i + 1]
    if (!v) throw new Error(`Missing value for ${argv[i]}`)
    return v
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--host') args.host = readValue(i)
    if (a === '--port' || a === '-p') args.port = Number(readValue(i))
    if (a === '--input' || a === '-i') args.input = readValue(i)
    if (a === '--summary') args.summaryKey = readValue(i)
    if (a === '--role') args.roleKey = readValue(i)
    if (a === '--template') args.template = readValue(i)
  }

  if (!Number.isFinite(args.port) || args.port <= 0 || args.port > 65535) {
    throw new Error(`Invalid --port: ${args.port}`)
  }

  return args
}

export async function runServe(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)

  const server = createResumeServer({
    inputPath: args.input,
    summaryKey: args.summaryKey,
    roleKey: args.roleKey,
    templatePath: args.template,
  })

  await new Promise<void>((resolve) => {
    server.listen(args.port, args.host, () => resolve())
  })

  const addr = server.address() as AddressInfo
  const url = `http://${addr.address}:${addr.port}/`
  // Blank lines to keep output readable / consistent.
  console.log(`\nServing resume at: ${url}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runServe().catch((e) => {
    const message = e instanceof Error ? e.message : String(e)
    process.exitCode = 1
    console.error(`\nERROR: ${message}\n`)
  })
}
