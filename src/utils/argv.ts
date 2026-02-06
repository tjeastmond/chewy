export function readRequiredArgValue(argv: string[], index: number): string {
  const value = argv[index + 1]
  if (!value) {
    throw new Error(`Missing value for ${argv[index]}`)
  }

  return value
}
