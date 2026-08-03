import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = path.join(repositoryRoot, "website/dist");
const database = JSON.parse(await fs.readFile(path.join(repositoryRoot, "data/processed/wanhua-community-associations.json"), "utf8"));
const sdgCandidates = JSON.parse(await fs.readFile(path.join(repositoryRoot, "data/processed/wanhua-community-sdg-candidate-statistics.json"), "utf8"));

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(path.join(outputRoot, "assets"), { recursive: true });
await fs.mkdir(path.join(outputRoot, "data/data-layer"), { recursive: true });

const rows = database.communities.map((community) => `
  <tr>
    <td><code>${escapeHtml(community.community_id)}</code></td>
    <td>${escapeHtml(community.community_name_zh)}</td>
    <td>${escapeHtml(community.village_name_zh ?? "未提供")}</td>
    <td>${escapeHtml(community.established_date ?? "未提供")}</td>
    <td>${community.latitude === null ? "缺" : "有"}</td>
  </tr>`).join("");

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="臺北市萬華區社區發展協會政府開放資料研究網站。">
  <title>萬華社區研究｜公開資料網站</title>
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <header><p>TAIPEI OPEN DATA · ${escapeHtml(database.generated_on)}</p><h1>萬華社區研究</h1><p class="lede">以可追溯的政府開放資料，整理萬華區 ${database.coverage.record_count} 個社區發展協會。</p></header>
  <main>
    <section class="metrics" aria-label="資料摘要">
      <article><strong>${database.coverage.record_count}</strong><span>協會紀錄</span></article>
      <article><strong>${database.quality_summary.coordinate_records}</strong><span>具有座標</span></article>
      <article><strong>${database.quality_summary.complete_core_records}</strong><span>核心欄位完整</span></article>
      <article><strong>${database.quality_summary.unique_address_villages}</strong><span>地址涵蓋里別</span></article>
    </section>
    <section><h2>SDG 候選審查</h2><p>以下數字是依核定方案名稱與活動類型產生的低信心候選，不是正式 SDG 涵蓋、成果或排名；目前人工覆核與正式映射均為 0。</p>
      <div class="metrics" aria-label="SDG 候選分布">
        <article><strong>${sdgCandidates.by_goal["3"]}</strong><span>SDG 3 候選</span></article>
        <article><strong>${sdgCandidates.by_goal["4"]}</strong><span>SDG 4 候選</span></article>
        <article><strong>${sdgCandidates.by_goal["10"]}</strong><span>SDG 10 候選</span></article>
        <article><strong>${sdgCandidates.by_goal["11"]}</strong><span>SDG 11 候選</span></article>
      </div>
    </section>
    <section><h2>研究資料目錄</h2><p>名冊列入不代表目前仍在營運；活動、補助、獎項與 SDG 成效需另行蒐證。</p><div class="table-wrap"><table><thead><tr><th>研究 ID</th><th>社區</th><th>里別</th><th>成立日期</th><th>座標</th></tr></thead><tbody>${rows}</tbody></table></div></section>
    <section><h2>研究資源</h2><div class="links"><a href="data/wanhua-community-associations.json">下載萬華 JSON</a><a href="data/wanhua-community-sdg-candidates.json">SDG 候選統計</a><a href="data/data-layer/CommunityProfile.json">CommunityProfile JSON</a><a href="https://wanhua-community-research.cs-lee.chatgpt.site">互動儀表板</a><a href="https://github.com/CSLee2291/taipei-community-research">GitHub Repository</a></div></section>
  </main>
  <footer>資料來源：臺北市政府社會局。依政府資料開放授權條款第 1 版利用。</footer>
</body>
</html>`;

const css = `:root{color-scheme:light;--paper:#f2eee6;--surface:#fffaf0;--ink:#182620;--muted:#64706a;--teal:#145c4f;--red:#b64e3b;--line:#d4ccbe}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}header,main,footer{width:min(1120px,calc(100% - 40px));margin:auto}header{padding:80px 0 54px;border-bottom:1px solid var(--line)}header p:first-child{font:700 12px ui-monospace;letter-spacing:.12em;color:var(--red)}h1{margin:12px 0;font-family:Georgia,"Noto Serif TC",serif;font-size:clamp(52px,10vw,110px);line-height:.95}.lede{max-width:680px;color:var(--muted);font-size:20px;line-height:1.7}main{padding:34px 0 80px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface);border:1px solid var(--line)}.metrics article{display:flex;flex-direction:column;padding:24px;border-right:1px solid var(--line)}.metrics article:last-child{border:0}.metrics strong{font:54px Georgia;color:var(--teal)}.metrics span{color:var(--muted);font-size:13px}section{margin-top:60px}h2{font:38px Georgia,"Noto Serif TC",serif}.table-wrap{overflow:auto;border:1px solid var(--line);background:var(--surface)}table{width:100%;border-collapse:collapse}th,td{padding:13px 16px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}th{background:var(--teal);color:white;font-size:12px}td{font-size:13px}.links{display:flex;flex-wrap:wrap;gap:12px}.links a{padding:12px 16px;background:var(--teal);color:white;text-decoration:none}.links a:hover{background:var(--red)}footer{padding:30px 0 50px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}@media(max-width:700px){header{padding-top:48px}.metrics{grid-template-columns:1fr 1fr}.metrics article:nth-child(2){border-right:0}.metrics article:nth-child(-n+2){border-bottom:1px solid var(--line)}}`;

await Promise.all([
  fs.writeFile(path.join(outputRoot, "index.html"), html, "utf8"),
  fs.writeFile(path.join(outputRoot, "assets/site.css"), css, "utf8"),
  fs.writeFile(path.join(outputRoot, ".nojekyll"), "", "utf8"),
  fs.copyFile(path.join(repositoryRoot, "dashboard/public/og.png"), path.join(outputRoot, "assets/og.png")),
  fs.copyFile(path.join(repositoryRoot, "data/processed/wanhua-community-associations.json"), path.join(outputRoot, "data/wanhua-community-associations.json")),
  fs.copyFile(path.join(repositoryRoot, "data/processed/wanhua-community-sdg-candidate-statistics.json"), path.join(outputRoot, "data/wanhua-community-sdg-candidates.json")),
]);

for (const file of await fs.readdir(path.join(repositoryRoot, "data/json"))) {
  if (file.endsWith(".json")) await fs.copyFile(path.join(repositoryRoot, "data/json", file), path.join(outputRoot, "data/data-layer", file));
}

console.log(JSON.stringify({ status: "built", output: "website/dist", records: database.coverage.record_count }, null, 2));
