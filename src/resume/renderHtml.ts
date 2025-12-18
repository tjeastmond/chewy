import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import Handlebars from 'handlebars'

import type { Resume } from './schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type RenderHtmlOptions = {
  summaryKey: string
  roleKey: string
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

function buildSkillsOrdered(resume: Resume, skillsOrder?: string[]) {
  const labels = skillsOrder?.length ? skillsOrder : Object.keys(resume.skills)
  return labels
    .filter((label) => Array.isArray(resume.skills[label]))
    .map((label) => ({ label, items: resume.skills[label] }))
}

export async function renderHtml(
  resume: Resume,
  options: RenderHtmlOptions
): Promise<string> {
  Handlebars.registerHelper('stripProtocol', stripProtocol)
  Handlebars.registerHelper('join', join)
  Handlebars.registerHelper('eq', eq)

  const defaultTemplatePath = path.resolve(__dirname, '../../templates/resume.hbs')
  const templatePath = options.templatePath ?? defaultTemplatePath
  const template = await readFile(templatePath, 'utf8')

  const summary =
    resume.summaries[options.summaryKey] ??
    resume.summaries.default ??
    Object.values(resume.summaries)[0] ??
    ''

  const skillsOrder =
    resume.role_targets?.[options.roleKey]?.emphasis?.skills_order

  const html = Handlebars.compile(template)({
    ...resume,
    summaryKey: options.summaryKey,
    roleKey: options.roleKey,
    summary,
    skillsOrdered: buildSkillsOrdered(resume, skillsOrder),
  })

  return html
}
