import { describe, expect, test } from 'vitest'

import { __testing } from '../src/resume/exportPdf.js'

describe('exportPdfFromHtml', () => {
  test('builds Chrome args that disable header/footer', () => {
    const outPath = '/tmp/resume.pdf'
    const url = 'file:///tmp/resume.html'

    const args = __testing.buildChromePrintToPdfArgs({ outPath, url })

    expect(args).toContain('--no-pdf-header-footer')
    expect(args).toContain(`--print-to-pdf=${outPath}`)
    expect(args).toContain(url)
  })
})
