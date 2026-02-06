import type { AddressInfo } from 'node:net'

import { createResumeServer } from './server.js'
import { readRequiredArgValue } from './utils/argv.js'

type ServeArgs = {
  host: string
  port: number
  input?: string
  summaryKey: string
  template?: string
}

function parseArgs(argv: string[]): ServeArgs {
  const args: ServeArgs = {
    host: '127.0.0.1',
    port: 3000,
    summaryKey: 'default',
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--host') args.host = readRequiredArgValue(argv, i)
    if (a === '--port' || a === '-p') args.port = Number(readRequiredArgValue(argv, i))
    if (a === '--input' || a === '-i') args.input = readRequiredArgValue(argv, i)
    if (a === '--summary') args.summaryKey = readRequiredArgValue(argv, i)
    if (a === '--template') args.template = readRequiredArgValue(argv, i)
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
