import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const sdgCandidatesByActivity = new Map();
for (const record of loaded.CommunitySDGs) {
  assert.equal(record.is_example, false, `${record.community_sdg_id}: SDG candidate cannot be synthetic`);
  assert.equal(record.record_status, "draft", `${record.community_sdg_id}: unreviewed candidate must remain draft`);
  assert.equal(record.data_quality_flag, "low_evidence", `${record.community_sdg_id}: candidate must disclose low evidence`);
  assert.equal(record.assessment_method, "rule_based", `${record.community_sdg_id}: candidate must be rule based before human review`);
  assert.equal(record.reviewer_role, "ai_assisted_candidate", `${record.community_sdg_id}: reviewer role must disclose AI assistance`);
  assert(record.activity_id, `${record.community_sdg_id}: candidate requires an activity foreign key`);
  assert(record.confidence_score > 0 && record.confidence_score <= 0.5, `${record.community_sdg_id}: unreviewed confidence must remain low`);
  assert.equal(record.indicator_name_zh, null, `${record.community_sdg_id}: candidate cannot invent an outcome indicator`);
  assert.equal(record.observed_value, null, `${record.community_sdg_id}: candidate cannot invent an observed result`);
  assert.equal(record.observed_unit, null, `${record.community_sdg_id}: candidate cannot invent an observed unit`);
  assert(record.notes?.includes("待人工覆核"), `${record.community_sdg_id}: missing human-review warning`);
  const candidateCount = (sdgCandidatesByActivity.get(record.activity_id) ?? 0) + 1;
  sdgCandidatesByActivity.set(record.activity_id, candidateCount);
}
assert.equal(sdgCandidatesByActivity.size, loaded.CommunityActivities.length, "CommunitySDGs: every activity requires one primary candidate");
assert([...sdgCandidatesByActivity.values()].every((count) => count === 1), "CommunitySDGs: primary candidate must be unique per activity");

console.log(JSON.stringify({
  status: "passed",
  datasets: Object.fromEntries(datasetNames.map((name) => [name, loaded[name].length])),
  checks: ["schema", "required_fields", "types", "csv_json_parity", "foreign_keys", "unique_keys", "ranking_formula", "synthetic_example_guard", "formal_activity_evidence_guard", "sdg_candidate_review_guard"],
}, null, 2));
