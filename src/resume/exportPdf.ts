import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function buildChromePrintToPdfArgs({ outPath, url }: { outPath: string; url: string }): string[] {
  return [
    '--headless',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    // Newer Chrome flag (replaces --print-to-pdf-no-header)
    '--no-pdf-header-footer',
    // Keep older flag too for older Chromium builds; unknown flags are ignored.
    '--print-to-pdf-no-header',
    `--print-to-pdf=${outPath}`,
    url,
  ]
}

function findChromeExecutable(): string | null {
  const envPath = process.env.CHROME_PATH
  if (envPath && existsSync(envPath)) return envPath

  const candidates = [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    // macOS default install location
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]

  for (const c of candidates) {
    if (c.startsWith('/') && existsSync(c)) return c
    const res = spawnSync(c, ['--version'], { encoding: 'utf8' })
    if (res.status === 0) return c
  }

  return null
}

export async function exportPdfFromHtml(html: string, outPath: string): Promise<void> {
  const chrome = findChromeExecutable()
  if (!chrome) {
    throw new Error(
      'PDF export requires Chrome/Chromium. Install Google Chrome or set CHROME_PATH to a Chromium-based browser executable.'
    )
  }

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'export-resume-pdf-'))
  const htmlPath = path.join(tmpDir, 'resume.html')

  try {
    await writeFile(htmlPath, html, 'utf8')

    const url = pathToFileURL(htmlPath).toString()
    const args = buildChromePrintToPdfArgs({ outPath, url })

    const res = spawnSync(chrome, args, { encoding: 'utf8' })
    if (res.status !== 0) {
      const details = [res.stderr, res.stdout].filter(Boolean).join('\n').trim()
      throw new Error(
        `PDF export failed to run Chrome/Chromium.\n\nCommand: ${chrome} ${args.join(' ')}\n\n${details}`
      )
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

export const __testing = {
  buildChromePrintToPdfArgs,
}
