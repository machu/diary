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
