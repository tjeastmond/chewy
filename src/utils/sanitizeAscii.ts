const REPLACEMENTS: Array<[from: string, to: string]> = [
  // Dashes / hyphens
  ['\u2014', '--'], // em dash —
  ['\u2013', '-'], // en dash –
  ['\u2212', '-'], // minus sign −

  // Quotes
  ['\u2018', "'"], // left single quote ‘
  ['\u2019', "'"], // right single quote ’
  ['\u201C', '"'], // left double quote “
  ['\u201D', '"'], // right double quote ”

  // Ellipsis
  ['\u2026', '...'], // …

  // Spaces / invisibles
  ['\u00A0', ' '], // non-breaking space
  ['\u200B', ''], // zero-width space
  ['\u200C', ''], // zero-width non-joiner
  ['\u200D', ''], // zero-width joiner
]

export function sanitizeAscii(input: string): string {
  let s = input

  for (const [from, to] of REPLACEMENTS) {
    s = s.replaceAll(from, to)
  }

  // Best-effort transliteration for accented characters (e.g., "é" -> "e").
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')

  // Final guard: ensure output is ASCII printable + common whitespace.
  // Replace anything else with '?' to avoid leaking smart/unicode characters.
  s = s.replace(/[^\t\n\r\x20-\x7E]/g, '?')

  return s
}
