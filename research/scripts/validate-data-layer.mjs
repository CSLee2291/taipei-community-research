import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateReview } from "./lib/sdg-review.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const datasetNames = [
  "CommunityProfile",
  "CommunityActivities",
  "CommunityAwards",
  "CommunitySDGs",
  "CommunityFunding",
  "CommunityAIRanking",
];

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
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  assert.equal(quoted, false, "CSV contains an unclosed quoted field");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function expectedCsvValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function validateType(value, schema, label) {
  if (value === null) {
    assert(Array.isArray(schema.type) && schema.type.includes("null"), `${label}: null is not allowed`);
    return;
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes("string")) assert.equal(typeof value, "string", `${label}: expected string`);
  else if (types.includes("boolean")) assert.equal(typeof value, "boolean", `${label}: expected boolean`);
  else if (types.includes("integer")) assert(Number.isInteger(value), `${label}: expected integer`);
  else if (types.includes("number")) assert.equal(typeof value, "number", `${label}: expected number`);
  if (schema.enum) assert(schema.enum.includes(value), `${label}: value is outside enum`);
}

const loaded = {};
for (const datasetName of datasetNames) {
  const [csvText, jsonText, schemaText] = await Promise.all([
    fs.readFile(path.join(repositoryRoot, "data/csv", `${datasetName}.csv`), "utf8"),
    fs.readFile(path.join(repositoryRoot, "data/json", `${datasetName}.json`), "utf8"),
    fs.readFile(path.join(repositoryRoot, "data/schema", `${datasetName}.schema.json`), "utf8"),
  ]);
  const csvRows = parseCsv(csvText);
  const publication = JSON.parse(jsonText);
  const schema = JSON.parse(schemaText);
  const fields = Object.keys(schema.items.properties);

  assert.equal(publication.dataset, datasetName, `${datasetName}: publication name mismatch`);
  assert.equal(publication.record_count, publication.records.length, `${datasetName}: JSON record count mismatch`);
  assert.deepEqual(csvRows[0], fields, `${datasetName}: CSV header does not match schema`);
  assert.equal(csvRows.length - 1, publication.records.length, `${datasetName}: CSV/JSON row count mismatch`);

  publication.records.forEach((record, rowIndex) => {
    assert.deepEqual(Object.keys(record), fields, `${datasetName} row ${rowIndex + 2}: field order or set mismatch`);
    for (const requiredField of schema.items.required) {
      assert(record[requiredField] !== null && record[requiredField] !== undefined && record[requiredField] !== "", `${datasetName} row ${rowIndex + 2}: required field ${requiredField} is empty`);
    }
    fields.forEach((field, columnIndex) => {
      validateType(record[field], schema.items.properties[field], `${datasetName}.${field}`);
      assert.equal(csvRows[rowIndex + 1][columnIndex], expectedCsvValue(record[field]), `${datasetName} row ${rowIndex + 2}: CSV/JSON mismatch in ${field}`);
    });
  });

  loaded[datasetName] = publication.records;
}

const communityIds = new Set(loaded.CommunityProfile.map((record) => record.community_id));
const activityById = new Map(loaded.CommunityActivities.map((record) => [record.activity_id, record]));
const sdgIds = new Set(loaded.CommunitySDGs.map((record) => record.community_sdg_id));

assert.equal(communityIds.size, loaded.CommunityProfile.length, "CommunityProfile: duplicate community_id");
assert.equal(activityById.size, loaded.CommunityActivities.length, "CommunityActivities: duplicate activity_id");
assert.equal(sdgIds.size, loaded.CommunitySDGs.length, "CommunitySDGs: duplicate community_sdg_id");

for (const datasetName of datasetNames.slice(1)) {
  for (const record of loaded[datasetName]) {
    assert(communityIds.has(record.community_id), `${datasetName}: unresolved community_id ${record.community_id}`);
    if (record.activity_id) {
      const activity = activityById.get(record.activity_id);
      assert(activity, `${datasetName}: unresolved activity_id ${record.activity_id}`);
      assert.equal(activity.community_id, record.community_id, `${datasetName}: activity belongs to another community`);
    }
  }
}

for (const record of loaded.CommunityAIRanking) {
  const total = Math.round((record.profile_completeness_score * 0.2 + record.community_participation_score * 0.2 + record.sdg_impact_score * 0.25 + record.governance_score * 0.2 + record.resource_sustainability_score * 0.15) * 10) / 10;
  assert.equal(record.total_score, total, `${record.ranking_id}: total_score cannot be reproduced`);
  assert(record.confidence_score >= 0 && record.confidence_score <= 1, `${record.ranking_id}: confidence_score out of range`);
}

for (const datasetName of ["CommunityAwards", "CommunityFunding", "CommunityAIRanking"]) {
  assert(loaded[datasetName].every((record) => record.is_example && record.data_quality_flag === "synthetic_example"), `${datasetName}: sample records must be explicitly synthetic`);
}

for (const record of loaded.CommunityActivities) {
  assert.equal(record.is_example, false, `${record.activity_id}: published activity cannot be synthetic`);
  assert.equal(record.record_status, "verified", `${record.activity_id}: activity must be source-verified`);
  assert.equal(record.evidence_level, "A", `${record.activity_id}: Sprint 2 activities require government evidence`);
  assert(record.source_url && record.source_title && record.source_accessed_on, `${record.activity_id}: activity source is incomplete`);
  assert(record.start_date || record.end_date || record.notes?.includes("原始預定期間"), `${record.activity_id}: activity period is missing`);
  assert.equal(record.participant_count, null, `${record.activity_id}: planned beneficiaries cannot be published as actual participants`);
}

const [candidateText, reviewText, reviewSchemaText] = await Promise.all([
  fs.readFile(path.join(repositoryRoot, "data/processed/wanhua-community-sdg-candidate-records.json"), "utf8"),
  fs.readFile(path.join(repositoryRoot, "research/reviews/CommunitySDGReviews.csv"), "utf8"),
  fs.readFile(path.join(repositoryRoot, "data/schema/CommunitySDGReviews.schema.json"), "utf8"),
]);
const candidatePublication = JSON.parse(candidateText);
const candidates = candidatePublication.records;
const candidateById = new Map(candidates.map((record) => [record.community_sdg_id, record]));
const mergedById = new Map(loaded.CommunitySDGs.map((record) => [record.community_sdg_id, record]));
assert.equal(candidatePublication.dataset, "WanhuaCommunitySDGCandidates", "SDG candidate publication name mismatch");
assert.equal(candidatePublication.record_count, candidates.length, "SDG candidate record count mismatch");
assert.equal(candidateById.size, candidates.length, "SDG candidate source contains duplicate IDs");

for (const candidate of candidates) {
  assert.equal(candidate.is_example, false, `${candidate.community_sdg_id}: SDG candidate cannot be synthetic`);
  assert.equal(candidate.record_status, "draft", `${candidate.community_sdg_id}: unreviewed candidate must remain draft`);
  assert.equal(candidate.data_quality_flag, "low_evidence", `${candidate.community_sdg_id}: candidate must disclose low evidence`);
  assert.equal(candidate.assessment_method, "rule_based", `${candidate.community_sdg_id}: generated candidate must be rule based`);
  assert.equal(candidate.reviewer_role, "ai_assisted_candidate", `${candidate.community_sdg_id}: candidate reviewer role must disclose AI assistance`);
  assert(candidate.activity_id, `${candidate.community_sdg_id}: candidate requires an activity foreign key`);
  assert(activityById.has(candidate.activity_id), `${candidate.community_sdg_id}: candidate activity is unresolved`);
  assert(candidate.confidence_score > 0 && candidate.confidence_score <= 0.5, `${candidate.community_sdg_id}: unreviewed confidence must remain low`);
  assert.equal(candidate.indicator_name_zh, null, `${candidate.community_sdg_id}: candidate cannot invent an outcome indicator`);
  assert.equal(candidate.observed_value, null, `${candidate.community_sdg_id}: candidate cannot invent an observed result`);
  assert.equal(candidate.observed_unit, null, `${candidate.community_sdg_id}: candidate cannot invent an observed unit`);
  assert(candidate.notes?.includes("待人工覆核"), `${candidate.community_sdg_id}: candidate is missing human-review warning`);
}

const reviewSchema = JSON.parse(reviewSchemaText);
const reviewFields = Object.keys(reviewSchema.items.properties);
const [reviewHeader, ...reviewRows] = parseCsv(reviewText);
assert.deepEqual(reviewHeader, reviewFields, "CommunitySDGReviews: CSV header does not match schema");
assert(reviewRows.every((row) => row.length === reviewFields.length), "CommunitySDGReviews: row width differs from header");
const reviews = reviewRows.map((row, rowIndex) => Object.fromEntries(reviewFields.map((field, columnIndex) => {
  const property = reviewSchema.items.properties[field];
  const rawValue = row[columnIndex];
  let value = rawValue === "" ? null : rawValue;
  const types = Array.isArray(property.type) ? property.type : [property.type];
  if (value !== null && types.includes("integer")) value = Number(value);
  if (value !== null && types.includes("number")) value = Number(value);
  validateType(value, property, `CommunitySDGReviews row ${rowIndex + 2}.${field}`);
  return [field, value];
})));
for (const [index, review] of reviews.entries()) {
  for (const requiredField of reviewSchema.items.required) assert(review[requiredField] !== null && review[requiredField] !== "", `CommunitySDGReviews row ${index + 2}: required field ${requiredField} is empty`);
  assert.equal(review.schema_version, reviewSchema.items.properties.schema_version.const, `CommunitySDGReviews row ${index + 2}: unsupported schema_version`);
}
const reviewById = new Map(reviews.map((review) => [review.community_sdg_id, review]));
assert.equal(reviewById.size, reviews.length, "CommunitySDGReviews: duplicate community_sdg_id");
assert.equal(reviews.length, candidates.length, "CommunitySDGReviews: exactly one row per candidate is required");
assert.equal(mergedById.size, candidates.length, "CommunitySDGs: merged publication must retain one audit record per candidate");

for (const review of reviews) {
  const candidate = candidateById.get(review.community_sdg_id);
  const merged = mergedById.get(review.community_sdg_id);
  assert(candidate, `${review.community_sdg_id}: review references an unknown candidate`);
  assert(merged, `${review.community_sdg_id}: merged publication record is missing`);
  validateReview(review, candidate);
  assert.equal(review.activity_id, candidate.activity_id, `${review.community_sdg_id}: review activity differs from candidate`);
  assert.equal(merged.activity_id, candidate.activity_id, `${review.community_sdg_id}: merged activity differs from candidate`);
  assert.equal(merged.community_id, candidate.community_id, `${review.community_sdg_id}: merged community differs from candidate`);
  assert.equal(merged.is_example, false, `${review.community_sdg_id}: merged SDG record cannot be synthetic`);
  assert.equal(merged.indicator_name_zh, null, `${review.community_sdg_id}: no reviewed outcome indicator has been supplied`);
  assert.equal(merged.observed_value, null, `${review.community_sdg_id}: no reviewed observed value has been supplied`);
  assert.equal(merged.observed_unit, null, `${review.community_sdg_id}: no reviewed observed unit has been supplied`);

  if (review.review_decision === "pending") {
    assert.deepEqual(merged, candidate, `${review.community_sdg_id}: pending review must not alter candidate publication`);
    assert.equal(review.second_review_status, "not_assessed", `${review.community_sdg_id}: pending first review cannot assess second review`);
    for (const field of reviewFields.slice(3, -1)) {
      if (field !== "second_review_status") assert.equal(review[field], null, `${review.community_sdg_id}: pending review must leave ${field} empty`);
    }
    continue;
  }

  assert(review.review_rationale_zh && review.reviewer_role && review.reviewed_on, `${review.community_sdg_id}: reviewed decision requires rationale, role and date`);
  assert.notEqual(review.second_review_status, "not_assessed", `${review.community_sdg_id}: reviewed decision must assess second-review need`);
  assert.equal(merged.assessment_method, "mixed", `${review.community_sdg_id}: reviewed AI candidate must use mixed assessment`);
  assert.equal(merged.reviewer_role, review.reviewer_role, `${review.community_sdg_id}: merged reviewer role differs from ledger`);
  assert.equal(merged.assessed_on, review.reviewed_on, `${review.community_sdg_id}: merged review date differs from ledger`);

  if (review.second_review_status === "completed") {
    assert(review.second_reviewer_role && review.second_reviewed_on, `${review.community_sdg_id}: completed second review requires role and date`);
  } else {
    assert.equal(review.second_reviewer_role, null, `${review.community_sdg_id}: second reviewer role requires completed status`);
    assert.equal(review.second_reviewed_on, null, `${review.community_sdg_id}: second review date requires completed status`);
  }

  if (["accept", "modify"].includes(review.review_decision)) {
    assert(Number.isInteger(review.reviewed_sdg_goal) && review.reviewed_sdg_goal >= 1 && review.reviewed_sdg_goal <= 17, `${review.community_sdg_id}: reviewed goal must be 1–17`);
    assert(review.reviewed_sdg_target?.startsWith(`${review.reviewed_sdg_goal}.`), `${review.community_sdg_id}: reviewed target must belong to reviewed goal`);
    assert(["direct", "indirect", "enabling"].includes(review.reviewed_alignment_type), `${review.community_sdg_id}: reviewed alignment is invalid`);
    assert(review.reviewed_confidence_score > 0 && review.reviewed_confidence_score <= 1, `${review.community_sdg_id}: reviewed confidence is invalid`);
    assert(["A", "B"].includes(review.evidence_level), `${review.community_sdg_id}: formal mapping requires A or B evidence`);
    assert(review.evidence_title && review.evidence_url, `${review.community_sdg_id}: formal mapping requires evidence title and URL`);
    const unchanged = review.reviewed_sdg_goal === candidate.sdg_goal && review.reviewed_sdg_target === candidate.sdg_target && review.reviewed_alignment_type === candidate.alignment_type;
    assert.equal(unchanged, review.review_decision === "accept", `${review.community_sdg_id}: accept/modify semantics are inconsistent`);
    assert.equal(merged.sdg_goal, review.reviewed_sdg_goal, `${review.community_sdg_id}: merged goal differs from review`);
    assert.equal(merged.sdg_target, review.reviewed_sdg_target, `${review.community_sdg_id}: merged target differs from review`);
    assert.equal(merged.alignment_type, review.reviewed_alignment_type, `${review.community_sdg_id}: merged alignment differs from review`);
    assert.equal(merged.confidence_score, review.reviewed_confidence_score, `${review.community_sdg_id}: merged confidence differs from review`);
    assert.equal(merged.record_status, review.second_review_status === "pending" ? "draft" : "verified", `${review.community_sdg_id}: formal status differs from second-review state`);
  } else if (review.review_decision === "reject") {
    assert.equal(merged.record_status, review.second_review_status === "pending" ? "draft" : "archived", `${review.community_sdg_id}: rejected candidate status differs from second-review state`);
    assert(merged.notes?.includes("人工覆核拒絕"), `${review.community_sdg_id}: rejected candidate must retain audit reason`);
  } else {
    assert.equal(review.review_decision, "defer", `${review.community_sdg_id}: unsupported review decision`);
    assert.equal(merged.record_status, "draft", `${review.community_sdg_id}: deferred candidate must remain draft`);
    assert(merged.notes?.includes("人工覆核暫緩"), `${review.community_sdg_id}: deferred candidate must retain audit reason`);
  }
}

const candidateCountsByActivity = new Map();
for (const candidate of candidates) candidateCountsByActivity.set(candidate.activity_id, (candidateCountsByActivity.get(candidate.activity_id) ?? 0) + 1);
assert.equal(candidateCountsByActivity.size, loaded.CommunityActivities.length, "CommunitySDGs: every activity requires one primary candidate");
assert([...candidateCountsByActivity.values()].every((count) => count === 1), "CommunitySDGs: primary candidate must be unique per activity");

console.log(JSON.stringify({
  status: "passed",
  datasets: Object.fromEntries(datasetNames.map((name) => [name, loaded[name].length])),
  checks: ["schema", "required_fields", "types", "csv_json_parity", "foreign_keys", "unique_keys", "ranking_formula", "synthetic_example_guard", "formal_activity_evidence_guard", "sdg_candidate_review_guard", "sdg_review_ledger", "sdg_review_merge_guard"],
}, null, 2));
