import YAML from 'yaml'

import type { Resume } from './schema.js'
import { flattenToRows } from '../utils/flatten.js'

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export function exportJson(resume: Resume): string {
  return `${JSON.stringify(resume, null, 2)}\n`
}

export function exportYaml(resume: Resume): string {
  return `${YAML.stringify(resume)}`
}

export function exportCsv(resume: Resume): string {
  const rows = flattenToRows(resume).filter((r) => r.path.length > 0)
  const lines = ['path,value']

  for (const row of rows) {
    lines.push(`${csvEscape(row.path)},${csvEscape(row.value)}`)
  }

  return `${lines.join('\n')}\n`
}

export function exportText(resume: Resume): string {
  const lines: string[] = []

  lines.push(resume.name)
  lines.push(resume.title)
  lines.push('')

  lines.push('CONTACT')
  lines.push(`Email: ${resume.contact.email}`)
  lines.push(`Phone: ${resume.contact.phone}`)
  lines.push(`Location: ${resume.contact.location}`)
  lines.push(`LinkedIn: ${resume.contact.linkedin}`)
  lines.push(`GitHub: ${resume.contact.github}`)
  lines.push('')

  lines.push('SUMMARY')
  lines.push(resume.summaries.default ?? Object.values(resume.summaries)[0] ?? '')
  lines.push('')

  lines.push('SKILLS')
  for (const group of Object.keys(resume.skills)) {
    lines.push(`${group}: ${resume.skills[group].join(' | ')}`)
  }
  lines.push('')

  lines.push('EXPERIENCE')
  for (const job of resume.experience) {
    lines.push(`${job.company} — ${job.role}`)
    lines.push(`${job.dates_display} / ${job.location}`)
    for (const h of job.highlights) lines.push(`- ${h}`)
    lines.push('')
  }

  return `${lines.join('\n').trimEnd()}\n`
}
