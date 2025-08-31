import { unified } from "unified";
import remarkParse from "remark-parse";
import strip from "strip-markdown";
import remarkStringify from "remark-stringify";

/**
 * Markdown をプレーンテキストへ変換
 * - unified + remark-parse + strip-markdown を使用
 * - 余分な空白は 1 つに縮約し、前後の空白を除去
 */
export async function mdToPlainText(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(strip)
    .use(remarkStringify, { listItemIndent: "one", fences: true })
    .process(md);

  return String(file).replace(/\s+/g, " ").trim();
}

