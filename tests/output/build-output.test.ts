import { beforeAll, describe, expect, it } from "vitest";
import { config as vercelConfig } from "../../vercel.mjs";
import {
  listHtmlFiles,
  outputPathExists,
  readDocument,
  readOutput,
  redirectDestination,
  requireDist,
  toDisplayDate,
  urlToOutputPath,
} from "./helpers";

let htmlFiles: string[];

beforeAll(async () => {
  await requireDist();
  htmlFiles = await listHtmlFiles();
});

describe("generated HTML", () => {
  it("emits non-empty HTML for every output page", async () => {
    expect(htmlFiles.length).toBeGreaterThan(1_000);

    for (const file of htmlFiles) {
      const html = await readOutput(file);
      expect(html.trim().length, file).toBeGreaterThan(0);
    }
  });

  it("emits the common document contract for Astro pages", async () => {
    const sitePages = htmlFiles.filter(
      (file) => !file.startsWith("diary/") && !file.startsWith("reference/"),
    );

    for (const file of sitePages) {
      const { $ } = await readDocument(file);
      expect($("html").attr("lang"), file).toBe("ja");
      expect($("head > title").length, file).toBe(1);
      expect($("main").length, file).toBe(1);
      expect($('link[rel="canonical"]').attr("href"), file).toBeTruthy();
    }
  });
});

describe("date display", () => {
  it("formats every post detail date as YYYY-MM-DD", async () => {
    const details = htmlFiles.filter((file) =>
      /^posts\/\d{8}\/p\d+\/index\.html$/.test(file),
    );
    expect(details.length).toBeGreaterThan(1_000);

    for (const file of details) {
      const date = file.match(/^posts\/(\d{8})\//)?.[1];
      expect(date, file).toBeDefined();
      const { $ } = await readDocument(file);
      expect($("article > header > p").last().text().trim(), file).toBe(
        toDisplayDate(date!),
      );
    }
  });

  it("formats every date-page heading as YYYY-MM-DD", async () => {
    const datePages = htmlFiles.filter((file) =>
      /^posts\/\d{8}\/index\.html$/.test(file),
    );

    for (const file of datePages) {
      const date = file.match(/^posts\/(\d{8})\//)?.[1];
      expect(date, file).toBeDefined();
      const { $ } = await readDocument(file);
      expect($("main > h1").first().text().trim(), file).toBe(
        `${toDisplayDate(date!)} のエントリ`,
      );
    }
  });
});

describe("tag links", () => {
  it("normalizes every tag slug and emits its destination page", async () => {
    let tagLinkCount = 0;

    for (const file of htmlFiles.filter(
      (candidate) => !candidate.startsWith("reference/"),
    )) {
      const { $ } = await readDocument(file);
      for (const element of $('a[href^="/tags/"]').toArray()) {
        tagLinkCount += 1;
        const href = $(element).attr("href")!;
        const slug = decodeURIComponent(
          new URL(href, "https://example.test").pathname.slice("/tags/".length),
        );
        expect(slug, `${file}: ${href}`).toBe(slug.trim().toLowerCase());
        expect(
          await outputPathExists(urlToOutputPath(href)),
          `${file}: ${href}`,
        ).toBe(true);
      }
    }

    expect(tagLinkCount).toBeGreaterThan(0);
  });
});

describe("pagination", () => {
  it("emits contiguous pages with consistent navigation", async () => {
    const numericPages = htmlFiles
      .map((file) => file.match(/^(\d+)\/index\.html$/)?.[1])
      .filter((page): page is string => page !== undefined)
      .map(Number)
      .toSorted((a, b) => a - b);
    const totalPages = numericPages.at(-1) ?? 1;

    expect(numericPages).toEqual(
      Array.from({ length: totalPages - 1 }, (_, index) => index + 2),
    );

    for (let page = 1; page <= totalPages; page += 1) {
      const file = page === 1 ? "index.html" : `${page}/index.html`;
      const { $ } = await readDocument(file);
      expect($("main > nav span").text().trim(), file).toBe(
        `Page ${page} / ${totalPages}`,
      );

      const cards = $("main > ul > li").length;
      expect(cards, file).toBeGreaterThan(0);
      expect(cards, file).toBeLessThanOrEqual(30);
      if (page < totalPages) expect(cards, file).toBe(30);

      const previous = $("main > nav a")
        .filter((_, element) => $(element).text().includes("前のページ"))
        .attr("href");
      const next = $("main > nav a")
        .filter((_, element) => $(element).text().includes("次のページ"))
        .attr("href");

      expect(previous, file).toBe(
        page === 1 ? undefined : page === 2 ? "/" : `/${page - 1}`,
      );
      expect(next, file).toBe(page === totalPages ? undefined : `/${page + 1}`);
    }
  });
});

describe("legacy redirect documents", () => {
  it("emits a consistent and valid destination for every legacy URL", async () => {
    const legacyFiles = htmlFiles.filter((file) =>
      /^diary\/\d{8}\.html$/.test(file),
    );
    expect(legacyFiles.length).toBeGreaterThan(1_000);

    for (const file of legacyFiles) {
      const date = file.match(/^diary\/(\d{8})\.html$/)?.[1];
      expect(date, file).toBeDefined();
      const { $ } = await readDocument(file);
      const destination = redirectDestination($);
      const canonical = $('link[rel="canonical"]').attr("href");
      const fallback = $("body > a").attr("href");
      expect(destination, file).toBeTruthy();
      expect(canonical, file).toBe(destination);
      expect(fallback, file).toBe(destination);

      const detailFiles = htmlFiles.filter((candidate) =>
        new RegExp(`^posts/${date}/p\\d+/index\\.html$`).test(candidate),
      );
      expect(detailFiles.length, file).toBeGreaterThan(0);
      const expected =
        detailFiles.length === 1
          ? `/${detailFiles[0].replace(/\/index\.html$/, "")}`
          : `/posts/${date}/`;
      expect(destination, file).toBe(expected);
      expect(
        await outputPathExists(urlToOutputPath(destination!)),
        `${file}: ${destination}`,
      ).toBe(true);
    }
  });

  it("redirects the legacy index to the site root", async () => {
    const { $ } = await readDocument("diary/index.html");
    expect(redirectDestination($)).toBe("/");
    expect($('link[rel="canonical"]').attr("href")).toBe("/");
    expect($("body > a").attr("href")).toBe("/");
  });
});

describe("Vercel redirects", () => {
  it("matches every generated legacy document with an HTTP 301 rule", async () => {
    const rules = vercelConfig.redirects;
    const sources = new Set(rules.map((rule) => rule.source));

    expect(sources.size).toBe(rules.length);
    expect(rules).toContainEqual({
      source: "/diary/",
      destination: "/",
      statusCode: 301,
    });
    expect(rules).toContainEqual({
      source: "/diary/index.html",
      destination: "/",
      statusCode: 301,
    });

    const legacyFiles = htmlFiles.filter((file) =>
      /^diary\/\d{8}\.html$/.test(file),
    );
    expect(rules.length).toBe(legacyFiles.length + 2);

    for (const file of legacyFiles) {
      const { $ } = await readDocument(file);
      const source = `/${file}`;
      const destination = redirectDestination($);
      expect(rules, source).toContainEqual({
        source,
        destination,
        statusCode: 301,
      });
    }

    for (const rule of rules) {
      expect(rule.statusCode, rule.source).toBe(301);
      expect(
        await outputPathExists(urlToOutputPath(rule.destination)),
        `${rule.source}: ${rule.destination}`,
      ).toBe(true);
    }
  });
});
