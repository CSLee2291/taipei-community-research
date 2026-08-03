import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const activityPath = path.join(root, "data/json/CommunityActivities.json");
const profilePath = path.join(root, "data/json/CommunityProfile.json");
const schemaPath = path.join(root, "data/schema/CommunitySDGs.schema.json");
const rulesPath = path.join(root, "research/mappings/activity-type-to-sdg-candidates.json");
const sourcesPath = path.join(root, "research/sources/sdg-framework-sources.json");
const csvPath = path.join(root, "data/csv/CommunitySDGs.csv");
const jsonPath = path.join(root, "data/json/CommunitySDGs.json");
const statisticsPath = path.join(root, "data/processed/wanhua-community-sdg-candidate-statistics.json");
const dashboardDataPath = path.join(root, "dashboard/app/data/wanhua-community-sdg-candidates.json");
const dashboardDownloadPath = path.join(root, "dashboard/public/data/wanhua-community-sdg-candidates.json");
const mappingReportPath = path.join(root, "docs/sdg-candidate-mapping.md");
const coverageReportPath = path.join(root, "docs/sdg-coverage-analysis.md");
const reviewQueuePath = path.join(root, "docs/sdg-review-queue.md");
const radarPath = path.join(root, "report/figures/sdg-candidate-radar.svg");

const RELEASE_DATE = "2026-08-03";
const RELEASE_TIMESTAMP = "2026-08-03T15:30:00Z";
const SCHEMA_VERSION = "1.1.0";

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function percent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

function polarPoint(index, count, radius, centerX = 320, centerY = 270) {
  const angle = (-Math.PI / 2) + (index * Math.PI * 2) / count;
  return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
}

function pointString(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function buildRadarSvg(goalEntries) {
  const max = Math.max(...goalEntries.map(([, count]) => count), 1);
  const grid = [0.25, 0.5, 0.75, 1].map((level) => {
    const points = goalEntries.map((_, index) => polarPoint(index, goalEntries.length, 180 * level));
    return `<polygon points="${pointString(points)}" fill="none" stroke="#cdc6b9" stroke-width="1"/>`;
  }).join("");
  const axes = goalEntries.map((_, index) => {
    const [x, y] = polarPoint(index, goalEntries.length, 180);
    return `<line x1="320" y1="270" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#cdc6b9" stroke-width="1"/>`;
  }).join("");
  const dataPoints = goalEntries.map(([, count], index) => polarPoint(index, goalEntries.length, 180 * (count / max)));
  const labels = goalEntries.map(([goal, count], index) => {
    const [x, y] = polarPoint(index, goalEntries.length, 218);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="700" fill="#182620">SDG ${goal}<tspan x="${x.toFixed(1)}" dy="22" font-size="13" font-weight="500" fill="#657069">${count} 筆候選</tspan></text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560" role="img" aria-labelledby="title desc">
  <title id="title">萬華社區 SDG 候選對應雷達圖</title>
  <desc id="desc">呈現 SDG 3、4、10、11 的候選紀錄數；所有紀錄均待人工覆核。</desc>
  <rect width="640" height="560" fill="#f2eee6"/>
  <text x="32" y="40" font-size="24" font-weight="700" fill="#182620">SDG 候選分布</text>
  <text x="32" y="66" font-size="13" fill="#657069">正規化基準為候選數最高的目標；不是成效分數。</text>
  ${grid}${axes}
  <polygon points="${pointString(dataPoints)}" fill="#145c4f" fill-opacity="0.24" stroke="#145c4f" stroke-width="4"/>
  ${dataPoints.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#b64e3b" stroke="#fffdf8" stroke-width="3"/>`).join("")}
  ${labels}
  <text x="320" y="538" text-anchor="middle" font-size="12" fill="#657069">候選資料 · human_reviewed = 0 · 不得解讀為正式涵蓋或績效</text>
</svg>\n`;
}

const [activityText, profileText, schemaText, rulesText, sourcesText] = await Promise.all([
  fs.readFile(activityPath, "utf8"),
  fs.readFile(profilePath, "utf8"),
  fs.readFile(schemaPath, "utf8"),
  fs.readFile(rulesPath, "utf8"),
  fs.readFile(sourcesPath, "utf8"),
]);
const activities = JSON.parse(activityText).records;
const profiles = JSON.parse(profileText).records;
const schema = JSON.parse(schemaText);
const rules = JSON.parse(rulesText);
const sources = JSON.parse(sourcesText);
const fields = Object.keys(schema.items.properties);
const profileById = new Map(profiles.map((profile) => [profile.community_id, profile]));

assert.equal(activities.length, 50, "Sprint 3 expects the 50 Sprint 2 activity records");
assert(activities.every((activity) => !activity.is_example), "Synthetic activities cannot enter SDG candidates");

const records = activities.map((activity) => {
  const baseRule = rules.activity_type_rules[activity.activity_type_code];
  assert(baseRule, `No SDG candidate rule for activity type ${activity.activity_type_code}`);
  const override = rules.title_overrides.find((candidate) =>
    candidate.activity_type === activity.activity_type_code && new RegExp(candidate.pattern).test(activity.activity_name_zh),
  );
  const selectedRule = override ?? baseRule;
  const goal = rules.goals[String(selectedRule.goal)];
  assert(goal, `Missing goal metadata for SDG ${selectedRule.goal}`);
  const sdgReference = sources.sources[goal.reference_key];
  assert(sdgReference, `Missing framework source ${goal.reference_key}`);
  return {
    community_sdg_id: `SDG-CAND-${activity.activity_id}`,
    community_id: activity.community_id,
    activity_id: activity.activity_id,
    sdg_goal: selectedRule.goal,
    sdg_target: selectedRule.target,
    alignment_type: selectedRule.alignment_type,
    evidence_summary_zh: `「${activity.activity_name_zh}」的核定名稱與活動類型支持提出 SDG ${selectedRule.goal} 候選；${selectedRule.rationale_zh}`,
    indicator_name_zh: null,
    observed_value: null,
    observed_unit: null,
    confidence_score: selectedRule.confidence_score,
    assessment_method: "rule_based",
    assessed_on: RELEASE_DATE,
    reviewer_role: "ai_assisted_candidate",
    source_title: activity.source_title,
    source_url: activity.source_url,
    record_status: "draft",
    data_quality_flag: "low_evidence",
    is_example: false,
    created_at: RELEASE_TIMESTAMP,
    updated_at: RELEASE_TIMESTAMP,
    schema_version: SCHEMA_VERSION,
    notes: `待人工覆核。活動來源只證明方案核定與預定期間；SDG 目標定義參考 ${sdgReference.title}（${sdgReference.url}）。沒有成果指標，不能發布為正式 SDG 成效或涵蓋率。`,
  };
});

assert.equal(new Set(records.map((record) => record.activity_id)).size, activities.length, "Every activity must have exactly one primary candidate");
assert(records.every((record) => record.record_status === "draft" && record.assessment_method === "rule_based"), "Candidates must remain draft and rule based");
assert(records.every((record) => record.observed_value === null && record.indicator_name_zh === null), "Candidate mappings cannot invent outcome indicators");

const byGoal = Object.fromEntries(Object.keys(rules.goals).map((goal) => [goal, records.filter((record) => record.sdg_goal === Number(goal)).length]));
const byTarget = Object.fromEntries([...new Set(records.map((record) => record.sdg_target))].sort().map((target) => [target, records.filter((record) => record.sdg_target === target).length]));
const years = [2023, 2024, 2025, 2026];
const byYearGoal = Object.fromEntries(years.map((year) => [
  String(year),
  Object.fromEntries(Object.keys(rules.goals).map((goal) => [
    goal,
    records.filter((record) => record.activity_id.startsWith(`ACT-${year}-`) && record.sdg_goal === Number(goal)).length,
  ])),
]));
const byCommunity = Object.fromEntries(profiles.map((profile) => [
  profile.community_id,
  records.filter((record) => record.community_id === profile.community_id).length,
]));
const mappedCommunities = Object.values(byCommunity).filter((count) => count > 0).length;
const statistics = {
  dataset: "WanhuaCommunitySDGCandidateStatistics",
  schema_version: SCHEMA_VERSION,
  mapping_version: rules.mapping_version,
  generated_at: RELEASE_TIMESTAMP,
  evidence_scope: "approved_plan_title_and_type",
  publication_status: "candidate_only",
  candidate_count: records.length,
  activity_population: activities.length,
  mapped_activity_count: activities.length,
  mapped_community_count: mappedCommunities,
  association_population: profiles.length,
  pending_human_review_count: records.length,
  human_reviewed_count: 0,
  formal_mapping_count: 0,
  by_goal: byGoal,
  by_target: byTarget,
  by_year_goal: byYearGoal,
  by_community: byCommunity,
  interpretation_note_zh: "所有對應均為依活動類型與名稱產生的低信心候選，尚未經人工覆核；不得解讀為正式 SDG 涵蓋、成果或排名。",
};

const csvText = [
  fields.join(","),
  ...records.map((record) => fields.map((field) => csvValue(record[field])).join(",")),
].join("\n") + "\n";
const publication = {
  dataset: "CommunitySDGs",
  schema_version: SCHEMA_VERSION,
  generated_at: RELEASE_TIMESTAMP,
  record_count: records.length,
  records,
};

const goalRows = Object.entries(byGoal).map(([goal, count]) =>
  `| SDG ${goal} | ${rules.goals[goal].label_zh} | ${count} | 0 | 待人工覆核 |`,
).join("\n");
const yearRows = years.map((year) =>
  `| ${year} | ${Object.keys(rules.goals).map((goal) => byYearGoal[String(year)][goal]).join(" | ")} | ${Object.values(byYearGoal[String(year)]).reduce((sum, count) => sum + count, 0)} |`,
).join("\n");
const communityRows = profiles.map((profile) =>
  `| ${profile.community_id} | ${profile.community_name_zh} | ${byCommunity[profile.community_id]} | ${byCommunity[profile.community_id] ? "候選待覆核" : "本次活動母體未匹配"} |`,
).join("\n");
const reviewRows = records.map((record) => {
  const activity = activities.find((candidate) => candidate.activity_id === record.activity_id);
  return `| ${record.community_sdg_id} | ${record.activity_id} | ${activity.activity_name_zh.replaceAll("|", "｜")} | ${record.sdg_target} | ${record.confidence_score} | 待人工覆核 |`;
}).join("\n");
const ruleRows = Object.entries(rules.activity_type_rules).map(([type, rule]) =>
  `| \`${type}\` | SDG ${rule.goal} | ${rule.target} | ${rule.alignment_type} | ${rule.confidence_score} |`,
).join("\n");

const mappingReport = `# 萬華區活動 SDG 候選對應

產生日期：${RELEASE_DATE}

Mapping version：${rules.mapping_version}
狀態：**候選資料，全部待人工覆核**

## 結論

Sprint 3 已為 Sprint 2 的 ${activities.length} 筆核定方案各產生一筆主要 SDG 候選，活動候選覆蓋為 ${activities.length}/${activities.length}；正式 SDG 對應仍為 **0**。這些候選只用於安排人工審查，不構成 SDG 成效、正式涵蓋率或排名。

## 證據邊界

- 活動來源只證明方案獲核定與預定期間，不證明活動完成或成果。
- 對應規則只使用活動類型與核定名稱；沒有成果指標時，\`observed_value\` 與 \`indicator_name_zh\` 保持空值。
- 每筆紀錄均為 \`record_status=draft\`、\`assessment_method=rule_based\`、\`reviewer_role=ai_assisted_candidate\`。
- 正式發布需要研究者逐筆核對目標定義、方案內容、成果證據、反證與限制。

## 規則

| 活動類型 | 候選目標 | 細項 | 對應類型 | 最高信心 |
| --- | --- | --- | --- | ---: |
${ruleRows}

## 框架來源

- [聯合國 17 項永續發展目標](${sources.sources["UN-SDG"].url})
- [臺灣永續發展目標](${sources.sources["TW-SDG"].url})

完整規則見 [activity-type-to-sdg-candidates.json](../research/mappings/activity-type-to-sdg-candidates.json)，逐筆審查見 [sdg-review-queue.md](sdg-review-queue.md)。
`;

const coverageReport = `# 萬華區 SDG 候選涵蓋分析

資料日期：${RELEASE_DATE}

## 重要說明

本頁的「候選數」不是正式涵蓋率，也不是活動成果。正式映射數目前為 **0**，必須待人工覆核後才能更新。

## 候選目標分布

| 目標 | 名稱 | 候選數 | 已人工覆核 | 狀態 |
| --- | --- | ---: | ---: | --- |
${goalRows}

## 年度候選分布

| 年度 | SDG 3 | SDG 4 | SDG 10 | SDG 11 | 合計 |
| ---: | ---: | ---: | ---: | ---: | ---: |
${yearRows}

## 社區候選覆蓋

| ID | 社區 | 候選數 | 狀態 |
| --- | --- | ---: | --- |
${communityRows}

## 雷達圖

![SDG 候選分布雷達圖](../report/figures/sdg-candidate-radar.svg)

雷達圖以候選紀錄數最高的目標作正規化基準，只呈現審查工作量分布，不表示目標達成程度或社區績效。
`;

const reviewQueue = `# SDG 候選人工覆核佇列

產生日期：${RELEASE_DATE}

## 覆核要求

每筆候選都必須由研究者檢查活動內容、SDG 細項定義、對應邏輯、成果指標、反證與限制。核定名稱不足以支持正式 SDG 結論；沒有成果資料時不得填入觀測值。

| 候選 ID | 活動 ID | 核定方案 | 候選細項 | 信心 | 狀態 |
| --- | --- | --- | --- | ---: | --- |
${reviewRows}

## TODO

- [ ] 由第一位研究者逐筆接受、修改或拒絕候選並記錄理由。
- [ ] 由第二位研究者抽查所有高影響或爭議映射。
- [ ] 只有完成覆核的紀錄才能改為 \`assessment_method=human_review\` 或 \`mixed\`。
- [ ] 取得活動成果證據後再建立指標與觀測值；不得用核定表的預計人數替代。
`;

for (const target of [statisticsPath, dashboardDataPath, dashboardDownloadPath, radarPath]) {
  await fs.mkdir(path.dirname(target), { recursive: true });
}
await Promise.all([
  fs.writeFile(csvPath, csvText, "utf8"),
  fs.writeFile(jsonPath, `${JSON.stringify(publication, null, 2)}\n`, "utf8"),
  fs.writeFile(statisticsPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDataPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDownloadPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(mappingReportPath, mappingReport, "utf8"),
  fs.writeFile(coverageReportPath, coverageReport, "utf8"),
  fs.writeFile(reviewQueuePath, reviewQueue, "utf8"),
  fs.writeFile(radarPath, buildRadarSvg(Object.entries(byGoal)), "utf8"),
]);

console.log(JSON.stringify({
  status: "built",
  candidates: records.length,
  mappedActivities: activities.length,
  humanReviewed: 0,
  formalMappings: 0,
  byGoal,
}, null, 2));
