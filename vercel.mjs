import { createLegacyRedirects } from "./scripts/legacy-redirects.mjs";

const redirects = createLegacyRedirects();
const VERCEL_ROUTE_LIMIT = 2_048;

if (redirects.length > VERCEL_ROUTE_LIMIT) {
  throw new Error(
    `Vercel redirects が上限を超えました: ${redirects.length} / ${VERCEL_ROUTE_LIMIT}`,
  );
}

export const config = { redirects };
