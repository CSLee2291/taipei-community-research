# Research Database Schema

Version: 1.1.0

Status: Active research data layer

This directory defines the normalized interchange schema for Taipei community research. The original CSV files remain headers-only normalized templates. The six `*.schema.json` files define the application-layer CSV and JSON publications with representative records under `data/csv/` and `data/json/`. `CommunityProfile.json` remains the consolidated profile API schema.

## Application-layer schemas

| Schema | CSV / JSON dataset | Purpose |
| --- | --- | --- |
| `CommunityProfile.schema.json` | `CommunityProfile` | Source-backed community identity and provenance |
| `CommunityActivities.schema.json` | `CommunityActivities` | Programs, services, and events |
| `CommunityAwards.schema.json` | `CommunityAwards` | Evidence-backed recognition records |
| `CommunitySDGs.schema.json` | `CommunitySDGs` | Reviewable SDG alignment assessments |
| `CommunityFunding.schema.json` | `CommunityFunding` | Funding application, award, and spending records |
| `CommunityAIRanking.schema.json` | `CommunityAIRanking` | Versioned, explainable evaluation output |

## Tables

| File | Grain | Primary key | Parent keys |
| --- | --- | --- | --- |
| `Community.csv` | One community and associated development organization | `community_id` | — |
| `CommunityActivity.csv` | One community program, event, service, or recurring activity | `activity_id` | `community_id` |
| `CommunitySDGs.csv` | One evidence-backed SDG alignment assessment | `community_sdg_id` | `community_id`, optional `activity_id` |
| `CommunityAwards.csv` | One public award or recognition | `award_id` | `community_id`, optional `activity_id` |
| `CommunityFunding.csv` | One funding application, award, grant, or support record | `funding_id` | `community_id`, optional `activity_id` |

## Relationships

- `Community` is the parent entity.
- `CommunityActivity` has a many-to-one relationship with `Community`.
- SDG, award, and funding records belong to one community and may additionally reference one activity.
- `CommunityProfile.json` assembles one community with arrays of all related records; it is a publication and API shape, not a replacement for normalized storage.

## Identifier conventions

Identifiers are stable project keys and must not be recycled:

- Community: `COM-...`
- Activity: `ACT-...`
- SDG assessment: `SDG-...`
- Award: `AWD-...`
- Funding: `FND-...`

Use uppercase ASCII letters, digits, and hyphens after the prefix. Do not encode mutable attributes such as district, organization status, or year in a stable identifier.

## Data conventions

- Encoding: UTF-8.
- Column names: lowercase `snake_case`.
- Dates: ISO 8601 `YYYY-MM-DD`.
- Timestamps: ISO 8601 UTC date-time values, normally ending in `Z`.
- Coordinates: WGS84 decimal degrees.
- Currency: ISO 4217 three-letter codes; monetary values do not include symbols or separators.
- Unknown values: leave the CSV cell empty. Explain consequential missingness in `notes` or `provenance_note`; do not use ambiguous sentinel values such as `N/A`, `-`, or `0`.
- Bilingual fields: retain authoritative Traditional Chinese in `_zh`; populate `_en` only when an approved translation exists.
- Personal data: do not place private contact details or unnecessary personal names in these tables.

## Provenance and quality

Every record carries source, access-date, lifecycle, quality, timestamp, and schema-version fields. A record may be marked `verified` only after its evidence and relationships have been checked. Derived or disputed values must be explained in `provenance_note` and flagged through `data_quality_flag`.

## Integrity rules

1. Primary keys are unique and non-empty.
2. Every `community_id` foreign key resolves to `Community.community_id`.
3. Every populated `activity_id` foreign key resolves to `CommunityActivity.activity_id` and belongs to the same community.
4. End dates must not precede start dates.
5. SDG goals are integers from 1 through 17; confidence scores range from 0 through 1.
6. Counts and monetary values are non-negative.
7. `created_at` must not be later than `updated_at`.
8. Published records must pass disclosure, provenance, and licensing review.

## Schema evolution

Use semantic versions in `schema_version`. Backward-incompatible field or meaning changes require a major version; compatible additions require a minor version; clarifications and non-structural corrections require a patch version. Document changes in the project `CHANGELOG.md` and provide migrations before publishing a new major schema.
