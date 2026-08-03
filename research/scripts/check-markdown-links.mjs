import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const excludedDirectories = new Set([".git", ".next", ".vite", ".vinext", "dist", "node_modules", "output"]);

async function collectMarkdownFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectMarkdownFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(entryPath);
  }
  return files;
}

const missing = [];
const files = await collectMarkdownFiles(repositoryRoot);
for (const file of files) {
  const text = await fs.readFile(file, "utf8");
  const links = text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of links) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || /^(?:https?:|mailto:|#)/i.test(rawTarget)) continue;
    const withoutFragment = rawTarget.split("#", 1)[0].split("?", 1)[0];
    if (!withoutFragment) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(withoutFragment));
    try {
      await fs.access(target);
    } catch {
      missing.push(`${path.relative(repositoryRoot, file)} -> ${rawTarget}`);
    }
  }
}

assert.equal(missing.length, 0, `Broken local Markdown links:\n${missing.join("\n")}`);
console.log(JSON.stringify({ status: "passed", markdown_files: files.length, broken_local_links: 0 }, null, 2));
