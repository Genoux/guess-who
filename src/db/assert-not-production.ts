/** Host prefix of the Neon `production` branch endpoint. */
export const PRODUCTION_ENDPOINT = "ep-wandering-truth";

/** Throws unless `url` is a database URL that is not the production branch (or production is allowed). */
export function assertNotProduction(
  url: string | undefined,
  { allowProduction = false } = {},
): asserts url is string {
  if (!url) throw new Error("DATABASE_URL is not set");
  if (allowProduction) return;
  if (new URL(url).hostname.startsWith(PRODUCTION_ENDPOINT)) {
    throw new Error("Refusing to run: DATABASE_URL points at the production endpoint");
  }
}
