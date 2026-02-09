import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import React, { useEffect, useMemo, useState } from 'react'
import { Box, render, Text, useInput } from 'ink'

import { ResumeSchema, type Resume } from './resume/schema.js'
import { exportCsv, exportJson, exportText, exportYaml } from './resume/exporters.js'
import { exportPdfFromHtml } from './resume/exportPdf.js'
import { renderHtml } from './resume/renderHtml.js'
import { readRequiredArgValue } from './utils/argv.js'
import { sanitizeBaseName } from './utils/sanitizeBaseName.js'
import { sanitizeAscii } from './utils/sanitizeAscii.js'

type Format = 'html' | 'pdf' | 'json' | 'csv' | 'yaml' | 'txt'

type CliArgs = {
  input?: string
  outDir?: string
  formats: Format[]
  summaryKey: string
  template?: string
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    formats: ['html', 'pdf', 'json', 'csv', 'yaml', 'txt'],
    summaryKey: 'default',
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--input' || a === '-i') args.input = readRequiredArgValue(argv, i)
    if (a === '--out-dir' || a === '-o') args.outDir = readRequiredArgValue(argv, i)
    if (a === '--format' || a === '-f') {
      const v = readRequiredArgValue(argv, i)
      args.formats =
        v === 'all'
          ? ['html', 'pdf', 'json', 'csv', 'yaml', 'txt']
          : (v.split(',').map((s) => s.trim().toLowerCase()) as Format[])
    }
    if (a === '--summary') args.summaryKey = readRequiredArgValue(argv, i)
    if (a === '--template') args.template = readRequiredArgValue(argv, i)
  }

  return args
}

export async function findDefaultInput(cwd: string): Promise<string> {
  const full = path.resolve(cwd, 'resume.json')
  try {
    await readFile(full, 'utf8')
    return full
  } catch {
    // Fall back to any JSON file in cwd that validates as a resume.
    const entries = await readdir(cwd)
    const jsonFiles = entries.filter((name) => name.toLowerCase().endsWith('.json') && name !== 'resume.json').sort()

    for (const file of jsonFiles) {
      const candidatePath = path.resolve(cwd, file)
      try {
        const raw = await readFile(candidatePath, 'utf8')
        const json = JSON.parse(raw) as unknown
        const parsed = ResumeSchema.safeParse(json)
        if (parsed.success) return candidatePath
      } catch {
        // Ignore unreadable or invalid JSON files and keep searching.
      }
    }

    throw new Error(
      'No input provided and no default resume JSON found at ./resume.json or any schema-valid JSON file in the current directory.',
    )
  }
}

function formatBackupTimestamp(now: Date): string {
  return String(Math.floor(now.getTime() / 1000))
}

export async function saveResumeBackup(
  inputPath: string,
  raw: string,
  options?: { historyDir?: string; now?: Date },
): Promise<string> {
  const historyDir = path.resolve(options?.historyDir ?? path.resolve(process.cwd(), 'history'))
  const timestamp = formatBackupTimestamp(options?.now ?? new Date())
  const resumeFileName = path.basename(inputPath)
  const backupPath = path.resolve(historyDir, `${timestamp}_${resumeFileName}`)

  await mkdir(historyDir, { recursive: true })
  await writeFile(backupPath, raw, 'utf8')

  return backupPath
}

async function loadResume(inputPath: string): Promise<Resume> {
  const raw = await readFile(inputPath, 'utf8')
  await saveResumeBackup(inputPath, raw)
  const json = JSON.parse(raw) as unknown
  return ResumeSchema.parse(json)
}

function outPath(outDir: string, baseName: string, ext: string) {
  return path.resolve(outDir, `${baseName}.${ext}`)
}

async function exportAll(
  resume: Resume,
  args: CliArgs,
  inputPath: string,
  baseNameOverride?: string,
): Promise<string[]> {
  const outDir = path.resolve(process.cwd(), args.outDir ?? 'out')
  const baseName = baseNameOverride ?? path.basename(inputPath, path.extname(inputPath))
  const written: string[] = []

  await mkdir(outDir, { recursive: true })

  const wantsHtml = args.formats.includes('html')
  const wantsPdf = args.formats.includes('pdf')
  const html =
    wantsHtml || wantsPdf
      ? await renderHtml(resume, {
          summaryKey: args.summaryKey,
          templatePath: args.template,
        })
      : null

  const fileWriters: Array<{
    format: Extract<Format, 'json' | 'yaml' | 'csv' | 'txt'>
    render: (r: Resume) => string
  }> = [
    { format: 'json', render: exportJson },
    { format: 'yaml', render: exportYaml },
    { format: 'csv', render: exportCsv },
    { format: 'txt', render: exportText },
  ]

  for (const writer of fileWriters) {
    if (!args.formats.includes(writer.format)) continue
    const p = outPath(outDir, baseName, writer.format)
    await writeFile(p, writer.render(resume), 'utf8')
    written.push(p)
  }

  if (wantsHtml) {
    const p = outPath(outDir, baseName, 'html')
    await writeFile(p, html ?? '', 'utf8')
    written.push(p)
  }

  if (wantsPdf) {
    const p = outPath(outDir, baseName, 'pdf')
    await exportPdfFromHtml(html ?? '', p)
    written.push(p)
  }

  return written
}

function FilenamePrompt({
  defaultValue,
  resumeFileName,
  onSubmit,
}: {
  defaultValue: string
  resumeFileName: string
  onSubmit: (baseName: string) => void
}) {
  const [value, setValue] = useState('')

  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'c') {
      process.exitCode = 130
      process.exit(130)
    }

    const isEnter = Boolean(key.return) || input === '\n' || input === '\r'
    if (isEnter) {
      const chosenRaw = value.length ? value : defaultValue
      const chosen = sanitizeBaseName(chosenRaw) || sanitizeBaseName(defaultValue) || 'resume'
      onSubmit(chosen)
      return
    }

    if (key.escape) {
      process.exitCode = 0
      process.exit(0)
    }

    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1))
      return
    }

    // Ignore other control keys (arrows, etc)
    if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.escape || key.tab) return

    setValue((v) => v + input)
  })

  const shown = value.length ? value : `Set name or press enter to continue with: ${defaultValue}`
  const isUsingDefault = value.length === 0

  return (
    <Box flexDirection="column" gap={1}>
      <Text>
        <Text color="#ff8c00">CHEWY</Text> . Resume: {resumeFileName}
      </Text>
      <Box flexDirection="column" gap={0}>
        <Box flexDirection="column" gap={0}>
          <Box borderTop borderBottom borderStyle="single" borderColor="#3b82f6" paddingX={1} paddingY={0}>
            <Text>
              <Text color="#93c5fd">&gt; </Text>
              <Text color={isUsingDefault ? 'gray' : undefined}>{shown}</Text>
              <Text backgroundColor="#3b82f6"> </Text>
            </Text>
          </Box>
        </Box>
      </Box>
      <Text color="gray">Press Enter to continue, Esc to exit</Text>
    </Box>
  )
}

function ConfirmExport({
  inputPath,
  outDir,
  formats,
  baseName,
  onConfirm,
  onBack,
}: {
  inputPath: string
  outDir: string
  formats: Format[]
  baseName: string
  onConfirm: () => void
  onBack: () => void
}) {
  useInput((input, key) => {
    if (key.ctrl && input.toLowerCase() === 'c') {
      process.exitCode = 130
      process.exit(130)
    }

    const isEnter = Boolean(key.return) || input === '\n' || input === '\r'
    if (isEnter) {
      onConfirm()
      return
    }

    if (key.escape) {
      onBack()
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text color="green">Review export settings</Text>
      <Box borderStyle="round" borderColor="gray" paddingX={1}>
        <Box flexDirection="column">
          <Text>
            Input: <Text color="cyan">{inputPath}</Text>
          </Text>
          <Text>
            Output dir: <Text color="cyan">{outDir}</Text>
          </Text>
          <Text>
            Base name: <Text color="cyan">{baseName}</Text>
          </Text>
          <Text>
            Formats: <Text color="cyan">{formats.join(', ')}</Text>
          </Text>
        </Box>
      </Box>
      <Text dimColor>Press Enter to export, Esc to rename</Text>
    </Box>
  )
}

function App({ argv }: { argv: string[] }) {
  const args = useMemo(() => parseArgs(argv), [argv])
  const hasTty = process.stdin.isTTY && process.stdout.isTTY
  const [status, setStatus] = useState<
    | { step: 'init' }
    | { step: 'loading'; inputPath: string }
    | { step: 'prompting'; inputPath: string; resume: Resume; defaultBaseName: string }
    | { step: 'confirming'; inputPath: string; resume: Resume; defaultBaseName: string; baseName: string }
    | { step: 'exporting'; inputPath: string; resume: Resume; baseName: string }
    | { step: 'done'; written: string[] }
    | { step: 'error'; message: string }
  >({ step: 'init' })

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (!hasTty) {
          throw new Error('A TTY terminal is required for prompts. Re-run chewy in an interactive shell.')
        }

        const cwd = process.cwd()
        const inputPath = path.resolve(cwd, args.input ?? (await findDefaultInput(cwd)))
        if (cancelled) return

        setStatus({ step: 'loading', inputPath })
        const resume = await loadResume(inputPath)
        if (cancelled) return

        const defaultBaseName = path.basename(inputPath, path.extname(inputPath))
        setStatus({ step: 'prompting', inputPath, resume, defaultBaseName })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        process.exitCode = 1
        setStatus({ step: 'error', message })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [args])

  useEffect(() => {
    if (status.step !== 'exporting') return
    let cancelled = false

    const run = async () => {
      try {
        const written = await exportAll(status.resume, args, status.inputPath, status.baseName)
        if (cancelled) return
        setStatus({ step: 'done', written })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        process.exitCode = 1
        setStatus({ step: 'error', message })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [args, status])

  if (status.step === 'init') return <Text>Starting...</Text>
  if (status.step === 'loading') return <Text>Validating resume JSON: {status.inputPath}</Text>
  if (status.step === 'prompting')
    return (
      <FilenamePrompt
        defaultValue={status.defaultBaseName}
        resumeFileName={path.basename(status.inputPath)}
        onSubmit={(baseName) =>
          setStatus({
            step: 'confirming',
            inputPath: status.inputPath,
            resume: status.resume,
            defaultBaseName: status.defaultBaseName,
            baseName: sanitizeBaseName(baseName) || 'resume',
          })
        }
      />
    )
  if (status.step === 'confirming')
    return (
      <ConfirmExport
        inputPath={status.inputPath}
        outDir={path.resolve(process.cwd(), args.outDir ?? 'out')}
        formats={args.formats}
        baseName={status.baseName}
        onConfirm={() =>
          setStatus({
            step: 'exporting',
            inputPath: status.inputPath,
            resume: status.resume,
            baseName: status.baseName,
          })
        }
        onBack={() =>
          setStatus({
            step: 'prompting',
            inputPath: status.inputPath,
            resume: status.resume,
            defaultBaseName: status.baseName,
          })
        }
      />
    )
  if (status.step === 'exporting') return <Text>Exporting...</Text>
  if (status.step === 'error') return <Text>ERROR: {sanitizeAscii(status.message)}</Text>

  return (
    <Box flexDirection="column">
      <Text color="green">Export complete</Text>
      <Text>Wrote:</Text>
      {status.written.map((p) => (
        <Text key={p}>- {p}</Text>
      ))}
    </Box>
  )
}

export function runCli(argv = process.argv.slice(2)) {
  render(<App argv={argv} />)
}
