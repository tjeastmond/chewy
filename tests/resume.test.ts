import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { ResumeSchema } from '../src/resume/schema.js'
import { exportCsv, exportJson, exportText, exportYaml } from '../src/resume/exporters.js'
import { renderHtml } from '../src/resume/renderHtml.js'

const fixturePath = path.resolve(process.cwd(), 'tjeastmond.json')

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
    expect(asJson).toMatch(/"name":\s*"TJ Eastmond"/)
    expectAsciiOnly(asJson)

    const asYaml = exportYaml(resume)
    expect(asYaml).toMatch(/name:\s*TJ Eastmond/)
    expectAsciiOnly(asYaml)

    const asCsv = exportCsv(resume)
    expect(asCsv.split('\n')[0]).toBe('path,value')
    expect(asCsv).toMatch(/name,TJ Eastmond/)
    expectAsciiOnly(asCsv)

    const asText = exportText(resume)
    expect(asText).toMatch(/TJ Eastmond/)
    expect(asText).toMatch(/EXPERIENCE/)
    expectAsciiOnly(asText)

    const html = await renderHtml(resume, { summaryKey: 'default', roleKey: 'staffplus' })
    expect(html).toMatch(/<title>.*Resume<\/title>/)
    expect(html).toMatch(/TJ Eastmond/)
    expectAsciiOnly(html)
  })
})
