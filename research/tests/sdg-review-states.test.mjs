import assert from "node:assert/strict";
import test from "node:test";
import { mergeCandidateWithReview } from "../scripts/lib/sdg-review.mjs";

const candidate = {
  community_sdg_id: "SDG-CAND-TEST-ACT-0001",
  community_id: "COM-TEST",
  activity_id: "ACT-TEST-0001",
  sdg_goal: 10,
  sdg_target: "10.2",
  alignment_type: "indirect",
  evidence_summary_zh: "合成測試候選，不是研究資料。",
  indicator_name_zh: null,
  observed_value: null,
  observed_unit: null,
  confidence_score: 0.4,
  assessment_method: "rule_based",
  assessed_on: "2026-08-03",
  reviewer_role: "ai_assisted_candidate",
  source_title: "合成測試來源",
  source_url: "https://example.com/test-candidate",
  record_status: "draft",
  data_quality_flag: "low_evidence",
  is_example: true,
  created_at: "2026-08-03T00:00:00Z",
  updated_at: "2026-08-03T00:00:00Z",
  schema_version: "test",
  notes: "合成測試候選。",
};

function review(overrides = {}) {
  return {
    community_sdg_id: candidate.community_sdg_id,
    activity_id: candidate.activity_id,
    review_decision: "pending",
    reviewed_sdg_goal: null,
    reviewed_sdg_target: null,
    reviewed_alignment_type: null,
    reviewed_confidence_score: null,
    evidence_level: null,
    evidence_title: null,
    evidence_url: null,
    review_rationale_zh: null,
    reviewer_role: null,
    reviewed_on: null,
    second_review_status: "not_assessed",
    second_reviewer_role: null,
    second_reviewed_on: null,
    notes: null,
    schema_version: "test",
    ...overrides,
  };
}

test("pending preserves the generated candidate", () => {
  assert.equal(mergeCandidateWithReview(candidate, review()), candidate);
});

test("accept produces a verified mixed assessment when second review is not required", () => {
  const merged = mergeCandidateWithReview(candidate, review({
    review_decision: "accept",
    reviewed_sdg_goal: 10,
    reviewed_sdg_target: "10.2",
    reviewed_alignment_type: "indirect",
    reviewed_confidence_score: 0.7,
    evidence_level: "A",
    evidence_title: "合成測試證據",
    evidence_url: "https://example.com/test-evidence",
    review_rationale_zh: "合成測試接受理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "not_required",
  }));
  assert.equal(merged.record_status, "verified");
  assert.equal(merged.assessment_method, "mixed");
  assert.equal(merged.confidence_score, 0.7);
});

test("modify applies the reviewed mapping and waits for pending second review", () => {
  const merged = mergeCandidateWithReview(candidate, review({
    review_decision: "modify",
    reviewed_sdg_goal: 11,
    reviewed_sdg_target: "11.3",
    reviewed_alignment_type: "enabling",
    reviewed_confidence_score: 0.6,
    evidence_level: "B",
    evidence_title: "合成測試證據",
    evidence_url: "https://example.com/test-evidence",
    review_rationale_zh: "合成測試修改理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "pending",
  }));
  assert.equal(merged.sdg_goal, 11);
  assert.equal(merged.sdg_target, "11.3");
  assert.equal(merged.record_status, "draft");
});

test("reject archives the candidate while preserving an audit record", () => {
  const merged = mergeCandidateWithReview(candidate, review({
    review_decision: "reject",
    review_rationale_zh: "合成測試拒絕理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "not_required",
  }));
  assert.equal(merged.record_status, "archived");
  assert.match(merged.notes, /人工覆核拒絕/);
});

test("defer keeps the reviewed candidate in draft", () => {
  const merged = mergeCandidateWithReview(candidate, review({
    review_decision: "defer",
    review_rationale_zh: "合成測試暫緩理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "not_required",
  }));
  assert.equal(merged.record_status, "draft");
  assert.equal(merged.assessment_method, "mixed");
  assert.match(merged.notes, /人工覆核暫緩/);
});

test("accept rejects a changed mapping", () => {
  assert.throws(() => mergeCandidateWithReview(candidate, review({
    review_decision: "accept",
    reviewed_sdg_goal: 11,
    reviewed_sdg_target: "11.3",
    reviewed_alignment_type: "enabling",
    reviewed_confidence_score: 0.7,
    evidence_level: "A",
    evidence_title: "合成測試證據",
    evidence_url: "https://example.com/test-evidence",
    review_rationale_zh: "合成測試錯誤接受理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "not_required",
  })), /accept must preserve mapping/);
});

test("formal mapping rejects level D evidence", () => {
  assert.throws(() => mergeCandidateWithReview(candidate, review({
    review_decision: "accept",
    reviewed_sdg_goal: 10,
    reviewed_sdg_target: "10.2",
    reviewed_alignment_type: "indirect",
    reviewed_confidence_score: 0.7,
    evidence_level: "D",
    evidence_title: "合成測試證據",
    evidence_url: "https://example.com/test-evidence",
    review_rationale_zh: "合成測試低證據接受理由。",
    reviewer_role: "test_primary_reviewer",
    reviewed_on: "2026-08-04",
    second_review_status: "not_required",
  })), /requires evidence level A or B/);
});
