import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { mergeCandidateWithReview, validateReview } from "./lib/sdg-review.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const candidatePath = path.join(root, "data/processed/wanhua-community-sdg-candidate-records.json");
const reviewPath = path.join(root, "research/reviews/CommunitySDGReviews.csv");
const reviewSchemaPath = path.join(root, "data/schema/CommunitySDGReviews.schema.json");
const sdgSchemaPath = path.join(root, "data/schema/CommunitySDGs.schema.json");
const profilePath = path.join(root, "data/json/CommunityProfile.json");
const activityPath = path.join(root, "data/json/CommunityActivities.json");
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  assert.equal(quoted, false, "CommunitySDGReviews.csv contains an unclosed quoted field");
  if (field || row.length) rows.push([...row, field.replace(/\r$/, "")]);
  return rows;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function coerce(value, property, label) {
  if (value === "") return null;
  const types = Array.isArray(property.type) ? property.type : [property.type];
  if (types.includes("integer")) {
    const parsed = Number(value);
    assert(Number.isInteger(parsed), `${label}: invalid integer`);
    return parsed;
  }
  if (types.includes("number")) {
    const parsed = Number(value);
    assert(Number.isFinite(parsed), `${label}: invalid number`);
    return parsed;
  }
  return value;
}

function pointString(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function polarPoint(index, count, radius, centerX = 320, centerY = 270) {
  const angle = (-Math.PI / 2) + (index * Math.PI * 2) / count;
  return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
}

function buildRadarSvg(goalEntries, reviewedCount, formalCount) {
  const max = Math.max(...goalEntries.map(([, count]) => count), 1);
  const grid = [0.25, 0.5, 0.75, 1].map((level) => `<polygon points="${pointString(goalEntries.map((_, index) => polarPoint(index, goalEntries.length, 180 * level)))}" fill="none" stroke="#cdc6b9" stroke-width="1"/>`).join("");
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
  <desc id="desc">呈現 SDG 3、4、10、11 的候選紀錄數；人工已審 ${reviewedCount} 筆，正式映射 ${formalCount} 筆。</desc>
  <rect width="640" height="560" fill="#f2eee6"/>
  <text x="32" y="40" font-size="24" font-weight="700" fill="#182620">SDG 候選分布</text>
  <text x="32" y="66" font-size="13" fill="#657069">正規化基準為候選數最高的目標；不是成效分數。</text>
  ${grid}${axes}
  <polygon points="${pointString(dataPoints)}" fill="#145c4f" fill-opacity="0.24" stroke="#145c4f" stroke-width="4"/>
  ${dataPoints.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#b64e3b" stroke="#fffdf8" stroke-width="3"/>`).join("")}
  ${labels}
  <text x="320" y="538" text-anchor="middle" font-size="12" fill="#657069">人工已審 ${reviewedCount} · 正式映射 ${formalCount} · 候選數不得解讀為績效</text>
</svg>\n`;
}

const [candidateText, reviewText, reviewSchemaText, sdgSchemaText, profileText, activityText, rulesText, sourcesText] = await Promise.all([
  fs.readFile(candidatePath, "utf8"),
  fs.readFile(reviewPath, "utf8"),
  fs.readFile(reviewSchemaPath, "utf8"),
  fs.readFile(sdgSchemaPath, "utf8"),
  fs.readFile(profilePath, "utf8"),
  fs.readFile(activityPath, "utf8"),
  fs.readFile(rulesPath, "utf8"),
  fs.readFile(sourcesPath, "utf8"),
]);
const candidatePublication = JSON.parse(candidateText);
const candidates = candidatePublication.records;
const reviewSchema = JSON.parse(reviewSchemaText);
const sdgSchema = JSON.parse(sdgSchemaText);
const profiles = JSON.parse(profileText).records;
const activities = JSON.parse(activityText).records;
const rules = JSON.parse(rulesText);
const sources = JSON.parse(sourcesText);
const reviewFields = Object.keys(reviewSchema.items.properties);
const sdgFields = Object.keys(sdgSchema.items.properties);
const [reviewHeader, ...reviewRows] = parseCsv(reviewText);
assert.deepEqual(reviewHeader, reviewFields, "CommunitySDGReviews.csv header differs from schema");
assert(reviewRows.every((row) => row.length === reviewFields.length), "CommunitySDGReviews.csv row width differs from header");
const reviews = reviewRows.map((row, rowIndex) => Object.fromEntries(reviewFields.map((field, columnIndex) => [
  field,
  coerce(row[columnIndex], reviewSchema.items.properties[field], `CommunitySDGReviews row ${rowIndex + 2} ${field}`),
])));
for (const [index, review] of reviews.entries()) {
  for (const requiredField of reviewSchema.items.required) assert(review[requiredField] !== null && review[requiredField] !== "", `CommunitySDGReviews row ${index + 2}: required field ${requiredField} is empty`);
  assert.equal(review.schema_version, reviewSchema.items.properties.schema_version.const, `CommunitySDGReviews row ${index + 2}: unsupported schema_version`);
}
assert.equal(new Set(reviews.map((review) => review.community_sdg_id)).size, reviews.length, "CommunitySDGReviews contains duplicate community_sdg_id");
assert.equal(reviews.length, candidates.length, "CommunitySDGReviews must contain exactly one row per candidate");
const reviewById = new Map(reviews.map((review) => [review.community_sdg_id, review]));
const activityById = new Map(activities.map((activity) => [activity.activity_id, activity]));

for (const candidate of candidates) {
  const review = reviewById.get(candidate.community_sdg_id);
  assert(review, `${candidate.community_sdg_id}: missing review ledger row`);
  validateReview(review, candidate);
}

const decisionCounts = Object.fromEntries(["pending", "accept", "modify", "reject", "defer"].map((decision) => [decision, reviews.filter((review) => review.review_decision === decision).length]));
const firstReviewedCount = reviews.length - decisionCounts.pending;
const secondReviewPendingCount = reviews.filter((review) => review.second_review_status === "pending").length;
const pendingHumanReviewCount = decisionCounts.pending + secondReviewPendingCount;

const records = candidates.map((candidate) => mergeCandidateWithReview(candidate, reviewById.get(candidate.community_sdg_id)));
for (const record of records) assert.deepEqual(Object.keys(record), sdgFields, `${record.community_sdg_id}: merged CommunitySDGs fields differ from schema`);

const formalRecords = records.filter((record) => record.record_status === "verified");
const reviewedDates = reviews.map((review) => review.reviewed_on).filter(Boolean).sort();
const generatedAt = reviewedDates.length ? `${reviewedDates.at(-1)}T00:00:00Z` : candidatePublication.generated_at;
const generatedOn = generatedAt.slice(0, 10);
const byGoal = Object.fromEntries(Object.keys(rules.goals).map((goal) => [goal, candidates.filter((record) => record.sdg_goal === Number(goal)).length]));
const formalByGoal = Object.fromEntries([...new Set([...Object.keys(rules.goals), ...formalRecords.map((record) => String(record.sdg_goal))])].sort((a, b) => Number(a) - Number(b)).map((goal) => [goal, formalRecords.filter((record) => record.sdg_goal === Number(goal)).length]));
const byTarget = Object.fromEntries([...new Set(candidates.map((record) => record.sdg_target))].sort().map((target) => [target, candidates.filter((record) => record.sdg_target === target).length]));
const years = [2023, 2024, 2025, 2026];
const byYearGoal = Object.fromEntries(years.map((year) => [String(year), Object.fromEntries(Object.keys(rules.goals).map((goal) => [goal, candidates.filter((record) => record.activity_id.startsWith(`ACT-${year}-`) && record.sdg_goal === Number(goal)).length]))]));
const byCommunity = Object.fromEntries(profiles.map((profile) => [profile.community_id, candidates.filter((record) => record.community_id === profile.community_id).length]));
const formalByCommunity = Object.fromEntries(profiles.map((profile) => [profile.community_id, formalRecords.filter((record) => record.community_id === profile.community_id).length]));
const mappedCommunities = Object.values(byCommunity).filter((count) => count > 0).length;
const publicationStatus = formalRecords.length ? "partially_reviewed" : "candidate_only";
const statistics = {
  dataset: "WanhuaCommunitySDGCandidateStatistics",
  schema_version: candidatePublication.schema_version,
  mapping_version: candidatePublication.mapping_version,
  generated_at: generatedAt,
  evidence_scope: "approved_plan_title_and_type_plus_human_review",
  publication_status: publicationStatus,
  candidate_count: candidates.length,
  activity_population: activities.length,
  mapped_activity_count: candidates.length,
  mapped_community_count: mappedCommunities,
  association_population: profiles.length,
  pending_human_review_count: pendingHumanReviewCount,
  first_reviewed_count: firstReviewedCount,
  second_review_pending_count: secondReviewPendingCount,
  human_reviewed_count: firstReviewedCount,
  formal_mapping_count: formalRecords.length,
  rejected_count: decisionCounts.reject,
  deferred_count: decisionCounts.defer,
  decision_counts: decisionCounts,
  by_goal: byGoal,
  formal_by_goal: formalByGoal,
  by_target: byTarget,
  by_year_goal: byYearGoal,
  by_community: byCommunity,
  formal_by_community: formalByCommunity,
  interpretation_note_zh: `候選 ${candidates.length} 筆；第一階段人工已審 ${firstReviewedCount} 筆，正式映射 ${formalRecords.length} 筆。候選數不得解讀為正式 SDG 涵蓋、成果或排名。`,
};

const csvText = [sdgFields.join(","), ...records.map((record) => sdgFields.map((field) => csvValue(record[field])).join(","))].join("\n") + "\n";
const publication = { dataset: "CommunitySDGs", schema_version: candidatePublication.schema_version, generated_at: generatedAt, record_count: records.length, records };
const goalRows = Object.entries(byGoal).map(([goal, count]) => `| SDG ${goal} | ${rules.goals[goal]?.label_zh ?? "人工修改目標"} | ${count} | ${formalByGoal[goal] ?? 0} |`).join("\n");
const yearRows = years.map((year) => `| ${year} | ${Object.keys(rules.goals).map((goal) => byYearGoal[String(year)][goal]).join(" | ")} | ${Object.values(byYearGoal[String(year)]).reduce((sum, count) => sum + count, 0)} |`).join("\n");
const communityRows = profiles.map((profile) => `| ${profile.community_id} | ${profile.community_name_zh} | ${byCommunity[profile.community_id]} | ${formalByCommunity[profile.community_id]} |`).join("\n");
const decisionLabels = { pending: "待第一階段覆核", accept: "接受", modify: "修改", reject: "拒絕", defer: "暫緩" };
const reviewTableRows = candidates.map((candidate) => {
  const activity = activityById.get(candidate.activity_id);
  const review = reviewById.get(candidate.community_sdg_id);
  const merged = records.find((record) => record.community_sdg_id === candidate.community_sdg_id);
  return `| ${candidate.community_sdg_id} | ${candidate.activity_id} | ${activity.activity_name_zh.replaceAll("|", "｜")} | ${candidate.sdg_target} | ${decisionLabels[review.review_decision]} | ${merged.record_status} |`;
}).join("\n");
const ruleRows = Object.entries(rules.activity_type_rules).map(([type, rule]) => `| \`${type}\` | SDG ${rule.goal} | ${rule.target} | ${rule.alignment_type} | ${rule.confidence_score} |`).join("\n");

const mappingReport = `# 萬華區活動 SDG 候選對應

產生日期：${generatedOn}

Mapping version：${rules.mapping_version}

狀態：**候選 ${candidates.length} 筆；第一階段人工已審 ${firstReviewedCount} 筆；正式映射 ${formalRecords.length} 筆**

## 結論

Sprint 3 為 ${activities.length} 筆核定方案各建立一筆主要候選。只有人工接受或修改、且不等待第二階段抽查的紀錄才計入正式映射；候選數不構成 SDG 成效、正式涵蓋率或排名。

## 證據邊界

- 活動來源只證明方案獲核定與預定期間，不證明活動完成或成果。
- 未審候選維持 \`draft + rule_based\`；人工決策由 [CommunitySDGReviews.csv](../research/reviews/CommunitySDGReviews.csv) 保存。
- 接受或修改的紀錄使用 \`assessment_method=mixed\`；沒有成果證據時，成果指標與觀測值仍保持空值。
- 拒絕紀錄保留為 \`archived\` 稽核軌跡；暫緩紀錄維持 \`draft\`。

## 候選規則

| 活動類型 | 候選目標 | 細項 | 對應類型 | 最高信心 |
| --- | --- | --- | --- | ---: |
${ruleRows}

## 框架來源

- [聯合國 17 項永續發展目標](${sources.sources["UN-SDG"].url})
- [臺灣永續發展目標](${sources.sources["TW-SDG"].url})

完整規則見 [activity-type-to-sdg-candidates.json](../research/mappings/activity-type-to-sdg-candidates.json)，逐筆狀態見 [sdg-review-queue.md](sdg-review-queue.md)。
`;

const coverageReport = `# 萬華區 SDG 候選涵蓋分析

資料日期：${generatedOn}

## 重要說明

候選數不是正式涵蓋率，也不是活動成果。目前第一階段人工已審 **${firstReviewedCount}** 筆，正式映射 **${formalRecords.length}** 筆。

## 候選與正式映射

| 目標 | 名稱 | 候選數 | 正式映射 |
| --- | --- | ---: | ---: |
${goalRows}

## 年度候選分布

| 年度 | SDG 3 | SDG 4 | SDG 10 | SDG 11 | 合計 |
| ---: | ---: | ---: | ---: | ---: | ---: |
${yearRows}

## 社區候選覆蓋

| ID | 社區 | 候選數 | 正式映射 |
| --- | --- | ---: | ---: |
${communityRows}

## 雷達圖

![SDG 候選分布雷達圖](../report/figures/sdg-candidate-radar.svg)

雷達圖只呈現候選審查工作量分布，不表示目標達成程度或社區績效。
`;

const reviewQueue = `# SDG 候選人工覆核佇列

產生日期：${generatedOn}

> 本頁由合併腳本產生，請勿直接編輯。人工決策保存於 [CommunitySDGReviews.csv](../research/reviews/CommunitySDGReviews.csv)。

## 覆核進度

- 候選：${candidates.length}
- 第一階段已審：${firstReviewedCount}
- 等待第二階段抽查：${secondReviewPendingCount}
- 正式映射：${formalRecords.length}
- 拒絕：${decisionCounts.reject}
- 暫緩：${decisionCounts.defer}

| 候選 ID | 活動 ID | 核定方案 | 原候選細項 | 人工決策 | 發布狀態 |
| --- | --- | --- | --- | --- | --- |
${reviewTableRows}

## TODO

- [${decisionCounts.pending ? " " : "x"}] 由第一位研究者逐筆接受、修改、拒絕或暫緩並記錄理由。
- [${secondReviewPendingCount ? " " : "x"}] 完成所有標記為待第二階段抽查的高影響或爭議映射。
- [ ] 取得活動成果證據後再建立指標與觀測值；不得用核定表預計人數替代。
`;

for (const target of [statisticsPath, dashboardDataPath, dashboardDownloadPath, radarPath]) await fs.mkdir(path.dirname(target), { recursive: true });
await Promise.all([
  fs.writeFile(csvPath, csvText, "utf8"),
  fs.writeFile(jsonPath, `${JSON.stringify(publication, null, 2)}\n`, "utf8"),
  fs.writeFile(statisticsPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDataPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDownloadPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(mappingReportPath, mappingReport, "utf8"),
  fs.writeFile(coverageReportPath, coverageReport, "utf8"),
  fs.writeFile(reviewQueuePath, reviewQueue, "utf8"),
  fs.writeFile(radarPath, buildRadarSvg(Object.entries(byGoal), firstReviewedCount, formalRecords.length), "utf8"),
]);

console.log(JSON.stringify({
  status: "merged",
  candidates: candidates.length,
  firstReviewed: firstReviewedCount,
  pendingSecondReview: secondReviewPendingCount,
  formalMappings: formalRecords.length,
  decisions: decisionCounts,
}, null, 2));
