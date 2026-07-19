import { expect, test } from "@playwright/test";

test("opens a post from the latest-entry cards", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("main > ul > li > a[aria-label]").first();
  const href = await card.getAttribute("href");
  expect(href).toMatch(/^\/posts\/\d{8}\/p\d+$/);

  await card.click();
  await expect(page).toHaveURL(new RegExp(`${href!.replaceAll("/", "\\/")}$`));
  await expect(page.locator("article > header > h1")).toBeVisible();
});

test("moves to the next page and back to the first page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "次のページ" }).click();
  await expect(page).toHaveURL(/\/2$/);
  await expect(page.getByText(/^Page 2 \/ \d+$/)).toBeVisible();

  await page.getByRole("link", { name: "前のページ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "まちゅダイアリー" }),
  ).toBeVisible();
});

test("normalizes a mixed-case tag URL", async ({ page }) => {
  await page.goto("/posts/20220621/p01");
  await page.getByRole("link", { name: "#Life", exact: true }).click();
  await expect(page).toHaveURL(/\/tags\/life$/);
  await expect(page.getByRole("heading", { name: "タグ: life" })).toBeVisible();
});

test("keeps legacy single and multi-entry URLs navigable", async ({ page }) => {
  await page.goto("/diary/20250831.html");
  await expect(page).toHaveURL(/\/posts\/20250831\/p01$/);

  await page.goto("/diary/20040201.html");
  await expect(page).toHaveURL(/\/posts\/20040201\/$/);
  await expect(
    page.getByRole("heading", { name: "2004-02-01 のエントリ" }),
  ).toBeVisible();
});

test("searches the full-text index from the header", async ({ page }) => {
  await page.goto("/");
  const search = page.locator("#header-search-input");
  await search.fill("OpenID");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=OpenID$/);
  await expect(page.locator("#search-status")).toContainText(
    /記事が見つかりました/,
  );
  await expect(
    page.locator('#search-results a[href^="/posts/"]').first(),
  ).toBeVisible();

  const tagLink = page.locator('#search-results a[href^="/tags/"]').first();
  await expect(tagLink).toBeVisible();
  const href = await tagLink.getAttribute("href");
  const slug = decodeURIComponent(href!.slice("/tags/".length));
  expect(slug).toBe(slug.trim().toLowerCase());
});

test("opens the mobile search form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "検索フォームを開く" }).click();

  const input = page.locator("#mobile-search-input");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
});
