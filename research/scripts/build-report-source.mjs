import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputDirectory = path.join(repositoryRoot, "report/output");
const [overview, quality, databaseText] = await Promise.all([
  fs.readFile(path.join(repositoryRoot, "report/wanhua/README.md"), "utf8"),
  fs.readFile(path.join(repositoryRoot, "report/wanhua/data-quality.md"), "utf8"),
  fs.readFile(path.join(repositoryRoot, "data/processed/wanhua-community-associations.json"), "utf8"),
]);
const database = JSON.parse(databaseText);
const stripTitle = (text) => text.replace(/^# .+\n+/, "");
const document = `---
title: "臺北市萬華區社區發展協會研究報告"
subtitle: "政府開放資料研究版"
date: "${database.generated_on}"
lang: zh-TW
---

# 研究總覽

![成立年代分布](figures/establishment-decades.png)

${stripTitle(overview)}

# 資料品質

![核心欄位涵蓋](figures/data-coverage.png)

${stripTitle(quality)}
`;
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(path.join(outputDirectory, "wanhua-research-report.md"), document, "utf8");
console.log(JSON.stringify({ status: "built", output: "report/output/wanhua-research-report.md" }, null, 2));
