# Research Protocol

Status: Draft

Last updated: 2026-08-03

## Scope

The initial study examines Taipei Community Development Associations and related community context during 2023–2026. The exact unit of analysis, geographic coverage, comparison strategy, and update cadence remain to be approved during the research-design phase.

## Evidence standards

1. Prefer authoritative, first-party, and stable public sources.
2. Record source title, publisher, URL or archival identifier, publication date, access date, and applicable terms.
3. Preserve source values before normalization.
4. Document transformations, inferred values, and conflict-resolution rules.
5. Treat absence of evidence as unknown unless a source supports a negative finding.

## Data lifecycle

1. **Register:** add the source and its terms before collection.
2. **Acquire:** place approved source snapshots in `data/external/` or `data/raw/`.
3. **Validate:** check structure, encoding, completeness, and integrity.
4. **Transform:** write intermediate outputs to `data/interim/`.
5. **Publish:** write analysis-ready, disclosure-reviewed outputs to `data/processed/`.
6. **Archive:** version releases and preserve enough metadata to reproduce them.

## Ethics and privacy

- Collect only data necessary to answer approved research questions.
- Do not commit credentials, private contact details, interview data, or other sensitive information.
- Separate public organizational facts from information about individuals.
- Document consent, retention, access, and deletion procedures before collecting non-public data.
- Review outputs for re-identification and disclosure risk before publication.

## Quality assurance

- Use stable identifiers and explicit missing-value conventions.
- Validate uniqueness, referential integrity, dates, administrative areas, and controlled vocabularies.
- Record known limitations and source coverage gaps.
- Require review of material schema, method, and interpretation changes.
- Ensure published claims can be regenerated from versioned inputs and code.

## Open decisions

- Primary and secondary research questions
- Unit of analysis and association identity rules
- Authoritative source hierarchy
- Geographic reference system
- Data schema and controlled vocabularies
- Analysis and publication toolchains
- Update cadence and release policy
