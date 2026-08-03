import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const sourceCsvPath = path.join(root, "research/sources/wanhua-community-activity-approvals-2023-2026.csv");
const sourceRegistryPath = path.join(root, "research/sources/wanhua-community-activity-sources.json");
const profilePath = path.join(root, "data/json/CommunityProfile.json");
const schemaPath = path.join(root, "data/schema/CommunityActivities.schema.json");
const csvPath = path.join(root, "data/csv/CommunityActivities.csv");
const jsonPath = path.join(root, "data/json/CommunityActivities.json");
const statisticsPath = path.join(root, "data/processed/wanhua-community-activity-statistics.json");
const dashboardDataPath = path.join(root, "dashboard/app/data/wanhua-community-activities.json");
const dashboardDownloadPath = path.join(root, "dashboard/public/data/wanhua-community-activities.json");
const sourceAuditCsvPath = path.join(root, "research/sources/wanhua-association-online-source-audit.csv");
const researchReportPath = path.join(root, "docs/activity-research.md");
const statisticsReportPath = path.join(root, "docs/activity-statistics.md");
const sourceAuditReportPath = path.join(root, "docs/activity-source-audit.md");

const RELEASE_DATE = "2026-08-03";
const RELEASE_TIMESTAMP = "2026-08-03T12:00:00Z";
const SCHEMA_VERSION = "1.1.0";
const ACTIVITY_TYPES = [
  "health_promotion",
  "education",
  "volunteer_service",
  "culture",
  "ecology",
  "disaster_preparedness",
  "care_service",
  "digital_learning",
  "youth_engagement",
  "food_support",
  "environment",
  "other",
];
const TYPE_LABELS = {
  health_promotion: "健康促進",
  education: "教育與學習",
  volunteer_service: "志工培力",
  culture: "文化與節慶",
  ecology: "生態",
  disaster_preparedness: "防災",
  care_service: "社區照顧",
  digital_learning: "數位學習",
  youth_engagement: "青年與親子",
  food_support: "食物支持",
  environment: "環境",
  other: "其他",
};
const GOVERNMENT_SERVICE_URLS = {
  "COM-0001": "https://esp.gov.taipei/openData/orgInfo/854",
  "COM-0010": "https://esp.gov.taipei/openData/orgInfo/1381",
  "COM-0012": "https://esp.gov.taipei/openData/orgInfo/1378",
  "COM-0024": "https://esp.gov.taipei/openData/orgInfo/852",
  "COM-0030": "https://esp.gov.taipei/openData/orgInfo/4570",
};

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
  assert.equal(quoted, false, "CSV contains an unclosed quoted field");
  if (field || row.length) rows.push([...row, field.replace(/\r$/, "")]);
  const [headers, ...values] = rows.filter((candidate) => candidate.some((value) => value !== ""));
  return values.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function percent(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

const [sourceText, sourceRegistryText, profileText, schemaText] = await Promise.all([
  fs.readFile(sourceCsvPath, "utf8"),
  fs.readFile(sourceRegistryPath, "utf8"),
  fs.readFile(profilePath, "utf8"),
  fs.readFile(schemaPath, "utf8"),
]);
const sourceRows = parseCsv(sourceText);
const sourceRegistry = JSON.parse(sourceRegistryText);
const profiles = JSON.parse(profileText).records;
const schema = JSON.parse(schemaText);
const profileById = new Map(profiles.map((profile) => [profile.community_id, profile]));
const allowedTypes = new Set(schema.items.properties.activity_type_code.enum);
const sourceIds = new Set();

assert.equal(sourceRows.length, 50, `Expected 50 transcribed approval rows, found ${sourceRows.length}`);
for (const row of sourceRows) {
  assert(!sourceIds.has(row.source_record_id), `Duplicate source record: ${row.source_record_id}`);
  sourceIds.add(row.source_record_id);
  const profile = profileById.get(row.community_id);
  assert(profile, `Unknown community_id: ${row.community_id}`);
  assert.equal(profile.community_name_zh, row.association_short_name, `${row.source_record_id}: association name mismatch`);
  assert(sourceRegistry.sources[row.source_key], `${row.source_record_id}: unknown source key`);
  assert(allowedTypes.has(row.activity_type_code), `${row.source_record_id}: activity type is outside schema enum`);
  assert(row.period_text || row.start_date || row.end_date, `${row.source_record_id}: missing period`);
}

const yearCounters = new Map();
const fields = Object.keys(schema.items.properties);
const records = sourceRows.map((row) => {
  const source = sourceRegistry.sources[row.source_key];
  const year = Number(source.year);
  const sequence = (yearCounters.get(year) ?? 0) + 1;
  yearCounters.set(year, sequence);
  const plannedBeneficiaries = row.planned_beneficiary_count ? Number(row.planned_beneficiary_count) : null;
  const approvedAmount = row.approved_amount_twd ? Number(row.approved_amount_twd) : null;
  const notes = [
    `來源轉錄碼 ${row.source_record_id}；核定表編號 ${row.source_row}，PDF 第 ${row.pdf_page} 頁。`,
    `原始預定期間：${row.period_text}。`,
    plannedBeneficiaries === null ? null : `預計受益人數：${plannedBeneficiaries}；此值不是實際參與人次。`,
    approvedAmount === null ? null : `核定金額：新臺幣 ${approvedAmount} 元；本 Sprint 不以金額評估成效。`,
    "證據只支持方案獲核定與預定執行期間，未查得核銷或成果資料，不得解讀為已執行或完成。",
  ].filter(Boolean).join(" ");
  return {
    activity_id: `ACT-${year}-${String(sequence).padStart(4, "0")}`,
    community_id: row.community_id,
    activity_name_zh: row.activity_name_zh,
    activity_type_code: row.activity_type_code,
    description_zh: `臺北市政府社會局核定之「${row.activity_name_zh}」方案；本紀錄保留核定名稱與預定執行期間。`,
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    recurring: row.recurring === "true",
    venue_name_zh: null,
    address_zh: null,
    participant_count: null,
    target_groups: null,
    evidence_level: "A",
    source_title: source.title,
    source_url: source.url,
    source_accessed_on: sourceRegistry.accessed_on,
    record_status: "verified",
    data_quality_flag: "low_evidence",
    is_example: false,
    created_at: RELEASE_TIMESTAMP,
    updated_at: RELEASE_TIMESTAMP,
    schema_version: SCHEMA_VERSION,
    notes,
  };
});

const csvText = [
  fields.join(","),
  ...records.map((record) => fields.map((field) => csvValue(record[field])).join(",")),
].join("\n") + "\n";
const publication = {
  dataset: "CommunityActivities",
  schema_version: SCHEMA_VERSION,
  generated_at: RELEASE_TIMESTAMP,
  record_count: records.length,
  records,
};

const byYear = Object.fromEntries([2023, 2024, 2025, 2026].map((year) => [
  String(year), records.filter((record) => record.start_date?.startsWith(String(year)) || record.end_date?.startsWith(String(year))).length,
]));
const byType = Object.fromEntries(ACTIVITY_TYPES.map((type) => [type, records.filter((record) => record.activity_type_code === type).length]));
const communityCounts = Object.fromEntries(profiles.map((profile) => [
  profile.community_id,
  records.filter((record) => record.community_id === profile.community_id).length,
]));
const coveredCommunities = Object.values(communityCounts).filter((count) => count > 0).length;
const statistics = {
  dataset: "WanhuaCommunityActivityStatistics",
  schema_version: SCHEMA_VERSION,
  generated_at: RELEASE_TIMESTAMP,
  evidence_scope: "approved_plan",
  record_count: records.length,
  association_population: profiles.length,
  association_coverage_count: coveredCommunities,
  association_without_matched_activity_count: profiles.length - coveredCommunities,
  by_year: byYear,
  by_type: byType,
  by_community: communityCounts,
  interpretation_note_zh: "統計單位為官方核定表中的方案紀錄，不是活動完成場次，也不是協會活躍度排名。",
};

const auditFields = [
  "community_id", "association_name_zh", "government_activity_record_count", "government_activity_years",
  "government_service_url", "official_website_url", "official_facebook_url", "self_managed_source_status", "todo",
];
const auditRows = profiles.map((profile) => {
  const communityRecords = records.filter((record) => record.community_id === profile.community_id);
  const years = [...new Set(communityRecords.map((record) => record.start_date?.slice(0, 4) ?? record.end_date?.slice(0, 4)).filter(Boolean))].sort();
  return {
    community_id: profile.community_id,
    association_name_zh: profile.association_name_zh,
    government_activity_record_count: communityRecords.length,
    government_activity_years: years.join(";"),
    government_service_url: GOVERNMENT_SERVICE_URLS[profile.community_id] ?? null,
    official_website_url: null,
    official_facebook_url: null,
    self_managed_source_status: "todo_not_verified",
    todo: "查證由協會自主管理且可公開再利用的官方網站與 Facebook；不得以同名頁面直接推定官方身分。",
  };
});
const auditCsv = [
  auditFields.join(","),
  ...auditRows.map((record) => auditFields.map((field) => csvValue(record[field])).join(",")),
].join("\n") + "\n";

const sourceList = Object.entries(sourceRegistry.sources).map(([key, source]) =>
  `- \`${key}\`：[${source.title}](${source.url})，臺北市政府社會局。`,
).join("\n");
const annualRows = Object.entries(byYear).map(([year, count]) => `| ${year} | ${count} |`).join("\n");
const typeRows = ACTIVITY_TYPES.map((type) => `| \`${type}\` | ${TYPE_LABELS[type]} | ${byType[type]} |`).join("\n");
const communityRows = profiles.map((profile) => {
  const count = communityCounts[profile.community_id];
  const years = auditRows.find((row) => row.community_id === profile.community_id).government_activity_years || "—";
  return `| ${profile.community_id} | ${profile.association_name_zh} | ${count} | ${years} | ${count ? "已匹配核定表" : "TODO：本次來源未匹配"} |`;
}).join("\n");

const researchReport = `# 萬華區 2023–2026 社區活動研究

資料截止日：${RELEASE_DATE}

## 結論

本 Sprint 從臺北市政府社會局官方核定表轉錄 **${records.length} 筆核定方案**，涵蓋 ${profiles.length} 個協會母體中的 **${coveredCommunities} 個**。其餘 ${profiles.length - coveredCommunities} 個協會在本次選定核定表中未匹配到活動方案，已列入 TODO；這不表示協會沒有活動。

## 證據邊界

- 每筆紀錄證明的是「方案獲核定」及「預定執行期間」，不是完成證明。
- 核定表的「預計受益人數」只留在來源轉錄與 notes，不寫入 \`participant_count\`，也不加總為成果。
- 月份級期間以月初／月底正規化至日期欄；精確原文保留在 notes。若只提供截止日，開始日保持空值。
- \`evidence_level=A\` 表示來源為政府官方文件，不代表成果證據強度；因此 \`data_quality_flag=low_evidence\`。
- 50 筆均為正式來源紀錄，已移除原有合成教學示例。

## 年度涵蓋

| 年度 | 核定方案紀錄 |
| ---: | ---: |
${annualRows}

## 33 個協會查核矩陣

| ID | 協會 | 匹配紀錄 | 年度 | 狀態 |
| --- | --- | ---: | --- | --- |
${communityRows}

## 官方來源

${sourceList}

完整轉錄見 [wanhua-community-activity-approvals-2023-2026.csv](../research/sources/wanhua-community-activity-approvals-2023-2026.csv)，協會網路來源查核見 [activity-source-audit.md](activity-source-audit.md)。
`;

const statisticsReport = `# 萬華區活動統計

統計版本：${SCHEMA_VERSION}  
產生日期：${RELEASE_DATE}

## 讀法

本頁統計的是臺北市政府社會局核定表的「方案紀錄數」，不是完成場次、參與人次、品質或協會績效。各年度核定流程與公開文件範圍不同，年度間不可直接作成成長率結論。

## 年度趨勢

| 年度 | 核定方案紀錄 |
| ---: | ---: |
${annualRows}

## 類型分布

| 代碼 | 類型 | 紀錄數 |
| --- | --- | ---: |
${typeRows}

## 涵蓋率

- 有匹配核定方案：${coveredCommunities} / ${profiles.length}（${percent(coveredCommunities, profiles.length)}%）。
- 本次來源未匹配：${profiles.length - coveredCommunities} / ${profiles.length}（${percent(profiles.length - coveredCommunities, profiles.length)}%）。
- 未匹配只表示選定政府核定表沒有對應紀錄，不得解讀為零活動。
`;

const auditMarkdownRows = auditRows.map((row) =>
  `| ${row.community_id} | ${row.association_name_zh} | ${row.government_activity_record_count} | ${row.government_service_url ? `[政府服務頁](${row.government_service_url})` : "—"} | TODO | TODO |`,
).join("\n");
const sourceAuditReport = `# 萬華區協會網路來源查核

查核日期：${RELEASE_DATE}

## 查核原則

本清單為 33 個協會逐筆建立來源槽位。政府核定表與政府服務平台可作為官方政府來源；協會自主管理的網站或 Facebook 必須有足以確認營運者身分的證據才收錄。本 Sprint 未能獨立驗證任何自主管理官網或 Facebook，因此不填入推測網址，全部保留 TODO。

| ID | 協會 | 政府活動紀錄 | 政府服務頁 | 協會官網 | 官方 Facebook |
| --- | --- | ---: | --- | --- | --- |
${auditMarkdownRows}

## TODO

- [ ] 逐一向協會或主管機關確認自主管理官網與 Facebook 的官方身分。
- [ ] 保存頁面首次與最後驗證日期，並建立失效連結處理程序。
- [ ] 只轉錄活動證據，不重新發布私人電話、電子郵件或個人社群帳號。

機器可讀清單見 [wanhua-association-online-source-audit.csv](../research/sources/wanhua-association-online-source-audit.csv)。
`;

for (const target of [statisticsPath, dashboardDataPath, dashboardDownloadPath]) {
  await fs.mkdir(path.dirname(target), { recursive: true });
}
await Promise.all([
  fs.writeFile(csvPath, csvText, "utf8"),
  fs.writeFile(jsonPath, `${JSON.stringify(publication, null, 2)}\n`, "utf8"),
  fs.writeFile(statisticsPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDataPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(dashboardDownloadPath, `${JSON.stringify(statistics, null, 2)}\n`, "utf8"),
  fs.writeFile(sourceAuditCsvPath, auditCsv, "utf8"),
  fs.writeFile(researchReportPath, researchReport, "utf8"),
  fs.writeFile(statisticsReportPath, statisticsReport, "utf8"),
  fs.writeFile(sourceAuditReportPath, sourceAuditReport, "utf8"),
]);

console.log(JSON.stringify({
  status: "built",
  records: records.length,
  associationCoverage: coveredCommunities,
  byYear,
  byType,
}, null, 2));
