export function sanitizeBaseName(input: string) {
  const s = input.trim()
  // Avoid path traversal and path separators; allow dots in the middle for names like "resume.v2".
  return s.replaceAll(/[\\/]/g, '-').replace(/^\.+/, '').trim()
}
