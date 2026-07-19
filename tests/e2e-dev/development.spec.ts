import { expect, test } from "@playwright/test";

test("serves the built Pagefind index from the development server", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.locator("#header-search-input");
  await search.fill("OpenID");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=OpenID$/);
  await expect(page.locator("#search-status")).toContainText(
    /記事が見つかりました/,
  );
  await expect(page.locator("#search-results > li").first()).toBeVisible();
});

test("shows content-based related articles in development", async ({
  page,
}) => {
  await page.goto("/posts/20250831/p01");

  await expect(page.getByRole("heading", { name: "関連記事" })).toBeVisible();
  const links = page.locator("#related-posts-heading + ul a");
  await expect(links).toHaveCount(3);
  await expect(links.first()).toHaveAttribute("href", /^\/posts\/\d{8}\/p\d+$/);
});
