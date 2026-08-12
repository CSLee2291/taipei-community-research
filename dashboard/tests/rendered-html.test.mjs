import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Wanhua research dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>萬華社區研究｜臺北市政府開放資料<\/title>/i);
  assert.match(html, /33/);
  assert.match(html, /協會資料目錄/);
  assert.match(html, /2023–2026 核定方案/);
  assert.match(html, /核定方案紀錄/);
  assert.match(html, /SDG 候選審查/);
  assert.match(html, /正式映射/);
  assert.match(html, /臺北市政府開放資料/);
  assert.match(html, /whdo\.gov\.taipei/);
  assert.match(html, /63000070/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships validated research data and removes the starter preview", async () => {
  const [dataText, activityText, sdgText, page, component, mapComponent, packageJson] = await Promise.all([
    readFile(new URL("../app/data/wanhua-community-associations.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/wanhua-community-activities.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/wanhua-community-sdg-candidates.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/WanhuaDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/GoogleCommunityMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const database = JSON.parse(dataText);
  const activities = JSON.parse(activityText);
  const sdgCandidates = JSON.parse(sdgText);
  assert.equal(database.coverage.record_count, 33);
  assert.equal(database.communities.length, 33);
  assert.equal(new Set(database.communities.map((community) => community.community_id)).size, 33);
  assert.equal(activities.record_count, 50);
  assert.equal(activities.association_population, 33);
  assert.equal(activities.association_coverage_count, 18);
  assert.deepEqual(activities.by_year, { 2023: 5, 2024: 30, 2025: 10, 2026: 5 });
  assert.equal(sdgCandidates.candidate_count, 50);
  assert.equal(sdgCandidates.mapped_activity_count, 50);
  assert.equal(sdgCandidates.pending_human_review_count, 50);
  assert.equal(sdgCandidates.human_reviewed_count, 0);
  assert.equal(sdgCandidates.formal_mapping_count, 0);
  assert.deepEqual(sdgCandidates.decision_counts, { pending: 50, accept: 0, modify: 0, reject: 0, defer: 0 });
  assert.deepEqual(sdgCandidates.by_goal, { 3: 3, 4: 8, 10: 20, 11: 19 });
  assert.match(page, /WanhuaDashboard/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /data\/wanhua-community-associations\.json/);
  assert.match(component, /GoogleCommunityMap/);
  assert.match(component, /核定方案紀錄/);
  assert.match(component, /SDG 候選審查/);
  assert.match(component, /候選分布雷達圖/);
  assert.match(mapComponent, /maps\.googleapis\.com\/maps\/api\/js/);
  assert.match(mapComponent, /www\.google\.com\/maps\/search\/\?api=1/);
  assert.match(mapComponent, /www\.google\.com\/maps\/dir\/\?api=1/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../public/data/wanhua-community-associations.json", import.meta.url));
  await access(new URL("../public/data/wanhua-community-activities.json", import.meta.url));
  await access(new URL("../public/data/wanhua-community-sdg-candidates.json", import.meta.url));
});
