import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import React, { useEffect, useMemo, useState } from 'react'
import { render, Text } from 'ink'

import { ResumeSchema, type Resume } from './resume/schema.js'
import { exportCsv, exportJson, exportText, exportYaml } from './resume/exporters.js'
import { exportPdfFromHtml } from './resume/exportPdf.js'
import { renderHtml } from './resume/renderHtml.js'

type Format = 'html' | 'pdf' | 'json' | 'csv' | 'yaml' | 'txt'

type CliArgs = {
  input?: string
  outDir?: string
  formats: Format[]
  summaryKey: string
  roleKey: string
  template?: string
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    formats: ['html', 'pdf', 'json', 'csv', 'yaml', 'txt'],
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
    if (a === '--input' || a === '-i') args.input = readValue(i)
    if (a === '--out-dir' || a === '-o') args.outDir = readValue(i)
    if (a === '--format' || a === '-f') {
      const v = readValue(i)
      args.formats =
        v === 'all'
          ? ['html', 'pdf', 'json', 'csv', 'yaml', 'txt']
          : (v.split(',').map((s) => s.trim().toLowerCase()) as Format[])
    }
    if (a === '--summary') args.summaryKey = readValue(i)
    if (a === '--role') args.roleKey = readValue(i)
    if (a === '--template') args.template = readValue(i)
  }

  return args
}

async function findDefaultInput(cwd: string): Promise<string> {
  const candidates = ['tjeastmond.json', 'resume.json']
  for (const c of candidates) {
    const full = path.resolve(cwd, c)
    try {
      await readFile(full, 'utf8')
      return full
    } catch {
      // continue
    }
  }
  throw new Error('No input provided and no default resume JSON found in current directory.')
}

async function loadResume(inputPath: string): Promise<Resume> {
  const raw = await readFile(inputPath, 'utf8')
  const json = JSON.parse(raw) as unknown
  return ResumeSchema.parse(json)
}

function outPath(outDir: string, baseName: string, ext: string) {
  return path.resolve(outDir, `${baseName}.${ext}`)
}

async function exportAll(resume: Resume, args: CliArgs, inputPath: string): Promise<string[]> {
  const outDir = path.resolve(process.cwd(), args.outDir ?? 'out')
  await mkdir(outDir, { recursive: true })
  const baseName = path.basename(inputPath, path.extname(inputPath))
  const written: string[] = []

  if (args.formats.includes('json')) {
    const p = outPath(outDir, baseName, 'json')
    await writeFile(p, exportJson(resume), 'utf8')
    written.push(p)
  }

  if (args.formats.includes('yaml')) {
    const p = outPath(outDir, baseName, 'yaml')
    await writeFile(p, exportYaml(resume), 'utf8')
    written.push(p)
  }

  if (args.formats.includes('csv')) {
    const p = outPath(outDir, baseName, 'csv')
    await writeFile(p, exportCsv(resume), 'utf8')
    written.push(p)
  }

  if (args.formats.includes('txt')) {
    const p = outPath(outDir, baseName, 'txt')
    await writeFile(p, exportText(resume), 'utf8')
    written.push(p)
  }

  if (args.formats.includes('html')) {
    const html = await renderHtml(resume, {
      summaryKey: args.summaryKey,
      roleKey: args.roleKey,
      templatePath: args.template,
    })
    const p = outPath(outDir, baseName, 'html')
    await writeFile(p, html, 'utf8')
    written.push(p)
  }

  if (args.formats.includes('pdf')) {
    const p = outPath(outDir, baseName, 'pdf')
    const html = await renderHtml(resume, {
      summaryKey: args.summaryKey,
      roleKey: args.roleKey,
      templatePath: args.template,
    })
    await exportPdfFromHtml(html, p)
    written.push(p)
  }

  return written
}

function App({ argv }: { argv: string[] }) {
  const args = useMemo(() => parseArgs(argv), [argv])
  const [status, setStatus] = useState<
    | { step: 'init' }
    | { step: 'loading'; inputPath: string }
    | { step: 'exporting'; inputPath: string }
    | { step: 'done'; written: string[] }
    | { step: 'error'; message: string }
  >({ step: 'init' })

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const cwd = process.cwd()
        const inputPath = path.resolve(cwd, args.input ?? (await findDefaultInput(cwd)))
        if (cancelled) return

        setStatus({ step: 'loading', inputPath })
        const resume = await loadResume(inputPath)
        if (cancelled) return

        setStatus({ step: 'exporting', inputPath })
        const written = await exportAll(resume, args, inputPath)
        if (cancelled) return

        setStatus({ step: 'done', written })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        process.exitCode = 1
        console.error(`\nERROR: ${message}\n`)
        setStatus({ step: 'error', message })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [args])

  if (status.step === 'init') return <Text>Starting…</Text>
  if (status.step === 'loading') return <Text>Validating resume JSON: {status.inputPath}</Text>
  if (status.step === 'exporting') return <Text>Exporting…</Text>
  if (status.step === 'error') return <Text>ERROR: {status.message}</Text>

  return (
    <>
      <Text>Wrote:</Text>
      {status.written.map((p) => (
        <Text key={p}>- {p}</Text>
      ))}
    </>
  )
}

export function runCli(argv = process.argv.slice(2)) {
  render(<App argv={argv} />)
}
