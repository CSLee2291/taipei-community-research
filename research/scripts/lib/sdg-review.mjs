import assert from "node:assert/strict";

function requireText(value, label) {
  assert.equal(typeof value, "string", `${label} is required`);
  assert(value.trim(), `${label} is required`);
}

function requireIsoDate(value, label) {
  requireText(value, label);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${label} must use YYYY-MM-DD`);
}

export function validateReview(review, candidate) {
  assert.equal(review.activity_id, candidate.activity_id, `${review.community_sdg_id}: activity_id differs from candidate`);
  const reviewedMappingFields = ["reviewed_sdg_goal", "reviewed_sdg_target", "reviewed_alignment_type", "reviewed_confidence_score"];
  const evidenceFields = ["evidence_level", "evidence_title", "evidence_url"];
  if (review.review_decision === "pending") {
    for (const field of [...reviewedMappingFields, ...evidenceFields, "review_rationale_zh", "reviewer_role", "reviewed_on", "second_reviewer_role", "second_reviewed_on", "notes"]) {
      assert.equal(review[field], null, `${review.community_sdg_id}: pending review must leave ${field} empty`);
    }
    assert.equal(review.second_review_status, "not_assessed", `${review.community_sdg_id}: pending review must use second_review_status=not_assessed`);
    return;
  }

  requireText(review.review_rationale_zh, `${review.community_sdg_id}.review_rationale_zh`);
  requireText(review.reviewer_role, `${review.community_sdg_id}.reviewer_role`);
  requireIsoDate(review.reviewed_on, `${review.community_sdg_id}.reviewed_on`);
  assert.notEqual(review.second_review_status, "not_assessed", `${review.community_sdg_id}: reviewed decision must assess second-review need`);

  if (review.second_review_status === "completed") {
    requireText(review.second_reviewer_role, `${review.community_sdg_id}.second_reviewer_role`);
    requireIsoDate(review.second_reviewed_on, `${review.community_sdg_id}.second_reviewed_on`);
  } else {
    assert.equal(review.second_reviewer_role, null, `${review.community_sdg_id}: second reviewer role requires completed status`);
    assert.equal(review.second_reviewed_on, null, `${review.community_sdg_id}: second review date requires completed status`);
  }

  if (["accept", "modify"].includes(review.review_decision)) {
    assert(Number.isInteger(review.reviewed_sdg_goal) && review.reviewed_sdg_goal >= 1 && review.reviewed_sdg_goal <= 17, `${review.community_sdg_id}: reviewed SDG goal must be 1–17`);
    requireText(review.reviewed_sdg_target, `${review.community_sdg_id}.reviewed_sdg_target`);
    assert(review.reviewed_sdg_target.startsWith(`${review.reviewed_sdg_goal}.`), `${review.community_sdg_id}: target must belong to reviewed goal`);
    assert(["direct", "indirect", "enabling"].includes(review.reviewed_alignment_type), `${review.community_sdg_id}: reviewed alignment type is invalid`);
    assert(review.reviewed_confidence_score > 0 && review.reviewed_confidence_score <= 1, `${review.community_sdg_id}: reviewed confidence must be within (0, 1]`);
    assert(["A", "B"].includes(review.evidence_level), `${review.community_sdg_id}: accepted or modified formal mapping requires evidence level A or B`);
    requireText(review.evidence_title, `${review.community_sdg_id}.evidence_title`);
    requireText(review.evidence_url, `${review.community_sdg_id}.evidence_url`);
    assert(["http:", "https:"].includes(new URL(review.evidence_url).protocol), `${review.community_sdg_id}: evidence URL must use HTTP(S)`);
    const unchanged = review.reviewed_sdg_goal === candidate.sdg_goal
      && review.reviewed_sdg_target === candidate.sdg_target
      && review.reviewed_alignment_type === candidate.alignment_type;
    assert.equal(unchanged, review.review_decision === "accept", `${review.community_sdg_id}: accept must preserve mapping; modify must change goal, target or alignment`);
  } else {
    for (const field of reviewedMappingFields) assert.equal(review[field], null, `${review.community_sdg_id}: ${review.review_decision} must leave ${field} empty`);
    const hasEvidence = Boolean(review.evidence_title || review.evidence_url || review.evidence_level);
    assert.equal(Boolean(review.evidence_title), hasEvidence, `${review.community_sdg_id}: evidence level, title and URL must be supplied together`);
    assert.equal(Boolean(review.evidence_url), hasEvidence, `${review.community_sdg_id}: evidence level, title and URL must be supplied together`);
    assert.equal(Boolean(review.evidence_level), hasEvidence, `${review.community_sdg_id}: evidence level, title and URL must be supplied together`);
    if (hasEvidence) assert(["http:", "https:"].includes(new URL(review.evidence_url).protocol), `${review.community_sdg_id}: evidence URL must use HTTP(S)`);
  }
}

export function mergeCandidateWithReview(candidate, review) {
  validateReview(review, candidate);
  if (review.review_decision === "pending") return candidate;
  const secondReviewNote = review.second_review_status === "completed"
    ? `第二階段抽查已於 ${review.second_reviewed_on} 完成。`
    : review.second_review_status === "pending" ? "仍待第二階段抽查。" : "不需第二階段抽查。";
  const common = {
    ...candidate,
    assessment_method: "mixed",
    assessed_on: review.reviewed_on,
    reviewer_role: review.reviewer_role,
    source_title: review.evidence_title ?? candidate.source_title,
    source_url: review.evidence_url ?? candidate.source_url,
    updated_at: `${review.reviewed_on}T00:00:00Z`,
  };
  if (["accept", "modify"].includes(review.review_decision)) {
    const finalized = review.second_review_status !== "pending";
    return {
      ...common,
      sdg_goal: review.reviewed_sdg_goal,
      sdg_target: review.reviewed_sdg_target,
      alignment_type: review.reviewed_alignment_type,
      evidence_summary_zh: `人工覆核${review.review_decision === "accept" ? "接受" : "修改"}：${review.review_rationale_zh}`,
      confidence_score: review.reviewed_confidence_score,
      record_status: finalized ? "verified" : "draft",
      data_quality_flag: "low_evidence",
      notes: `人工覆核決策=${review.review_decision}；證據層級=${review.evidence_level}。${secondReviewNote} 未提供活動成果證據，指標與觀測值維持空值。${review.notes ? ` ${review.notes}` : ""}`,
    };
  }
  if (review.review_decision === "reject") {
    return {
      ...common,
      record_status: review.second_review_status === "pending" ? "draft" : "archived",
      data_quality_flag: "low_evidence",
      notes: `人工覆核拒絕：${review.review_rationale_zh} ${secondReviewNote} 此候選不計入正式映射。${review.notes ? ` ${review.notes}` : ""}`,
    };
  }
  return {
    ...common,
    record_status: "draft",
    data_quality_flag: "low_evidence",
    notes: `人工覆核暫緩：${review.review_rationale_zh} ${secondReviewNote} 仍待補充證據，不計入正式映射。${review.notes ? ` ${review.notes}` : ""}`,
  };
}
