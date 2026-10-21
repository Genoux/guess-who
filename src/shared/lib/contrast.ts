const INK = "#191910";
const WHITE = "#FFFFFF";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rgb or #rrggbb color, or null when it cannot be read. */
export function relativeLuminance(hex: string): number | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(digits.slice(i, i + 2), 16));
  return 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a) ?? 1;
  const lb = relativeLuminance(b) ?? 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink or white, whichever reads better on a team color. Unknown colors get ink. */
export function readableOn(background: string): "ink" | "white" {
  if (relativeLuminance(background) === null) return "ink";
  return contrastRatio(background, INK) >= contrastRatio(background, WHITE) ? "ink" : "white";
}
