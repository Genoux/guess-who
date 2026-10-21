/** "Ana" from "Ana Ferreira"; the whole name when it is one word. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
