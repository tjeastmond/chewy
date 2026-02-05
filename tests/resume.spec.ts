import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { ResumeSchema } from '../src/resume/schema.js'
import { exportCsv, exportJson, exportText, exportYaml } from '../src/resume/exporters.js'
import { renderHtml } from '../src/resume/renderHtml.js'

const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/test_resume.json')

function expectAsciiOnly(value: string) {
  // Allow ASCII printable chars plus common whitespace (\t, \n, \r).
  // Disallow any other Unicode, including smart quotes/dashes/ellipsis/NBSP.
  expect(value).not.toMatch(/[^\t\n\r\x20-\x7E]/)
}

describe('resume exports', () => {
  test('fixture validates', async () => {
    const raw = await readFile(fixturePath, 'utf8')
    const json = JSON.parse(raw) as unknown

    const parsed = ResumeSchema.safeParse(json)
    expect(parsed.success).toBe(true)
  })

  test('exports JSON/YAML/CSV/TXT and renders HTML', async () => {
    const raw = await readFile(fixturePath, 'utf8')
    const json = JSON.parse(raw) as unknown
    const resume = ResumeSchema.parse(json)

    const asJson = exportJson(resume)
    expect(asJson).toMatch(/"name":\s*"Arthur Morgan"/)
    expectAsciiOnly(asJson)

    const asYaml = exportYaml(resume)
    expect(asYaml).toMatch(/name:\s*Arthur Morgan/)
    expectAsciiOnly(asYaml)

    const asCsv = exportCsv(resume)
    expect(asCsv.split('\n')[0]).toBe('path,value')
    expect(asCsv).toMatch(/name,Arthur Morgan/)
    expectAsciiOnly(asCsv)

    const asText = exportText(resume)
    expect(asText).toMatch(/Arthur Morgan/)
    expect(asText).toMatch(/EXPERIENCE/)
    expectAsciiOnly(asText)

    const html = await renderHtml(resume, { summaryKey: 'default' })
    expect(html).toMatch(/<title>.*Resume<\/title>/)
    expect(html).toMatch(/Arthur Morgan/)
    // Font sizes should be kept in sync with the print/PDF styles in the template.
    expect(html).toContain('h1 { font-size: 47px;')
    expect(html).toContain('.tagline { font-size: 13px;')
    expect(html).toContain('.contact { font-size: 13px;')
    expect(html).toContain('font-size: 15px;')
    expect(html).toContain('.skills { font-size: 13px;')
    expect(html).toContain('.summary { font-size: 14px;')
    expect(html).toContain('.job-title { font-weight: bold; font-size: 17px;')
    expect(html).toContain('.job-meta { font-size: 12px;')
    expect(html).toContain('li { margin-bottom: 6px; font-size: 13px;')
    expect(html).toContain('@media print')
    expect(html).toContain('h1 { font-size: 40px; }')
    expect(html).toContain('.skills { font-size: 12px;')
    expect(html).toContain('.summary { font-size: 13px;')
    expect(html).toContain('.job-title { font-size: 15px; }')
    expect(html).toContain('.job-meta { font-size: 11px;')
    expect(html).toContain('li { font-size: 12px;')
    expectAsciiOnly(html)
  })
})
