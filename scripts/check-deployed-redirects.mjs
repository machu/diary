import process from "node:process";

const baseURL =
  process.argv.slice(2).find((argument) => argument !== "--") ??
  process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error(
    "Vercel Preview の URL を指定してください: `pnpm test:redirects -- https://example.vercel.app`",
  );
}

const cases = [
  ["/diary/", "/"],
  ["/diary/20250831.html", "/posts/20250831/p01"],
  ["/diary/20040201.html", "/posts/20040201/"],
];

for (const [source, destination] of cases) {
  const response = await fetch(new URL(source, baseURL), {
    redirect: "manual",
  });
  const location = response.headers.get("location");
  const actualDestination = location
    ? new URL(location, baseURL).pathname
    : undefined;

  if (response.status !== 301 || actualDestination !== destination) {
    throw new Error(
      `${source}: expected 301 ${destination}, got ${response.status} ${location ?? "(Locationなし)"}`,
    );
  }

  console.log(`${source} -> ${response.status} ${destination}`);
}
