# Data

Research data is separated by lifecycle stage. Dataset files are ignored by default until their provenance, sensitivity, licensing, and publication status have been reviewed.

## Directories

- `schema/` — versioned table templates, field constraints, and the consolidated profile schema.
- `external/` — unchanged third-party data acquired from outside the project.
- `raw/` — immutable first-party collection outputs or source snapshots.
- `interim/` — temporary normalized, joined, or enriched datasets.
- `processed/` — validated, analysis-ready or approved publication datasets.

## Dataset requirements

Every dataset should have accompanying metadata that records:

- title and stable dataset identifier;
- source, publisher, and access date;
- license or use restrictions;
- collection method and temporal coverage;
- schema version and character encoding;
- transformation lineage;
- sensitivity classification and publication decision;
- known limitations.

Do not commit secrets, personal data, restricted data, or large binary datasets without an approved storage and access plan.
