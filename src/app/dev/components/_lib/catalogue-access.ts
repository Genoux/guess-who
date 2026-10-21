type CatalogueEnv = {
  nodeEnv?: string;
  vercelEnv?: string;
};

/** Fails closed: only local dev and Vercel previews see the catalogue; anything else 404s. */
export function isCatalogueEnabled({ nodeEnv, vercelEnv }: CatalogueEnv): boolean {
  return nodeEnv === "development" || vercelEnv === "preview";
}
