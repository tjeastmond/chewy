import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import Handlebars from 'handlebars'

import { resolveSummary } from './schema.js'
import type { Resume } from './schema.js'
import { sanitizeAscii } from '../utils/sanitizeAscii.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type RenderHtmlOptions = {
  summaryKey: string
  templatePath?: string
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

function join(items: string[], sep: string): string {
  return items.join(sep)
}

function eq(a: unknown, b: unknown): boolean {
  return a === b
}

function buildSkillsOrdered(resume: Resume) {
  return Object.keys(resume.skills)
    .filter((label) => Array.isArray(resume.skills[label]))
    .map((label) => ({ label, items: resume.skills[label] }))
}

Handlebars.registerHelper('stripProtocol', stripProtocol)
Handlebars.registerHelper('join', join)
Handlebars.registerHelper('eq', eq)

export async function renderHtml(resume: Resume, options: RenderHtmlOptions): Promise<string> {

  const template = await (async () => {
    const candidates = options.templatePath
      ? [options.templatePath]
      : [
          // Unbundled (src/resume -> repo root/templates)
          path.resolve(__dirname, '../../templates/resume.hbs'),
          // Bundled (dist -> repo root/templates)
          path.resolve(__dirname, '../templates/resume.hbs'),
          // Fallback: current working directory
          path.resolve(process.cwd(), 'templates/resume.hbs'),
        ]

    for (const p of candidates) {
      try {
        return await readFile(p, 'utf8')
      } catch {
        // continue
      }
    }

    throw new Error('Could not find a default template. Provide one with --template.')
  })()

  const html = Handlebars.compile(template)({
    ...resume,
    summaryKey: options.summaryKey,
    summary: resolveSummary(resume, options.summaryKey),
    skillsOrdered: buildSkillsOrdered(resume),
  })

  return sanitizeAscii(html)
}
