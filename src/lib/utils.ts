export function regexToObject(input: string, regex: RegExp) {
  const matches = Array.from(input.matchAll(regex))

  let object: Record<string, string> = {}

  for (const match of matches) {
    object[match[1]] = match[2]
  }

  return object
}