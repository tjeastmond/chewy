export type FlatRow = { path: string; value: string }

export function flattenToRows(input: unknown): FlatRow[] {
  const rows: FlatRow[] = []

  const walk = (value: unknown, currentPath: string) => {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      rows.push({ path: currentPath, value: value == null ? '' : String(value) })
      return
    }

    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${currentPath}[${i}]`))
      return
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      for (const key of Object.keys(obj).sort()) {
        walk(obj[key], currentPath ? `${currentPath}.${key}` : key)
      }
      return
    }

    rows.push({ path: currentPath, value: String(value) })
  }

  walk(input, '')
  return rows
}
