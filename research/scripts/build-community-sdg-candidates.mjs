import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const activityPath = path.join(root, "data/json/CommunityActivities.json");
const schemaPath = path.join(root, "data/schema/CommunitySDGs.schema.json");
const rulesPath = path.join(root, "research/mappings/activity-type-to-sdg-candidates.json");
const sourcesPath = path.join(root, "research/sources/sdg-framework-sources.json");
const candidatePath = path.join(root, "data/processed/wanhua-community-sdg-candidate-records.json");

const RELEASE_DATE = "2026-08-03";
const RELEASE_TIMESTAMP = "2026-08-03T15:30:00Z";
const SCHEMA_VERSION = "1.1.0";

const [activityText, schemaText, rulesText, sourcesText] = await Promise.all([
  fs.readFile(activityPath, "utf8"),
  fs.readFile(schemaPath, "utf8"),
  fs.readFile(rulesPath, "utf8"),
  fs.readFile(sourcesPath, "utf8"),
]);
const activities = JSON.parse(activityText).records;
const schema = JSON.parse(schemaText);
const rules = JSON.parse(rulesText);
const sources = JSON.parse(sourcesText);
const fields = Object.keys(schema.items.properties);

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
  const record = {
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
  assert.deepEqual(Object.keys(record), fields, `${record.community_sdg_id}: candidate fields differ from CommunitySDGs schema`);
  return record;
});

assert.equal(new Set(records.map((record) => record.activity_id)).size, activities.length, "Every activity must have exactly one primary candidate");
assert(records.every((record) => record.record_status === "draft" && record.assessment_method === "rule_based"), "Candidates must remain draft and rule based");
assert(records.every((record) => record.observed_value === null && record.indicator_name_zh === null), "Candidate mappings cannot invent outcome indicators");

const publication = {
  dataset: "WanhuaCommunitySDGCandidates",
  schema_version: SCHEMA_VERSION,
  mapping_version: rules.mapping_version,
  generated_at: RELEASE_TIMESTAMP,
  record_count: records.length,
  records,
};

await fs.mkdir(path.dirname(candidatePath), { recursive: true });
await fs.writeFile(candidatePath, `${JSON.stringify(publication, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: "built",
  output: path.relative(root, candidatePath),
  candidates: records.length,
  mappingVersion: rules.mapping_version,
}, null, 2));
