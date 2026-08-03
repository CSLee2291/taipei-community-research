# Taipei Community Research

A long-term, reproducible research project on Taipei Community Development Associations and the communities they serve, with an initial study period of 2023–2026.

## Purpose

This repository provides a shared home for research design, source material, structured data, analysis, public-facing outputs, and project decisions. It is organized so that evidence can be traced from collection through analysis to publication.

## Research objectives

- Build a documented inventory of Taipei community development associations.
- Track organizational, geographic, and program changes over time.
- Preserve source provenance and data-processing decisions.
- Produce transparent analyses, reports, dashboards, and public web resources.
- Support repeatable updates beyond the initial 2023–2026 study period.

## Repository structure

| Path | Purpose |
| --- | --- |
| `docs/` | Project governance, methodology, data dictionary, and technical documentation |
| `data/` | External, raw, interim, and processed research data |
| `dashboard/` | Interactive analysis and dashboard source code |
| `website/` | Public project website source code and content |
| `report/` | Long-form reports, figures, tables, and publication assets |
| `research/` | Research questions, literature notes, field notes, and source registers |
| `ROADMAP.md` | Planned phases, deliverables, and decision gates |
| `CHANGELOG.md` | Notable changes to the project and its outputs |

Each top-level work area contains its own README with scope and conventions.

## Working principles

1. **Traceability:** every derived record should be traceable to a source and processing step.
2. **Reproducibility:** transformations and analyses should be scriptable where practical.
3. **Data minimization:** collect only information needed for the stated research purpose.
4. **Respect and privacy:** do not commit personal, sensitive, or restricted information.
5. **Separation of concerns:** keep source data, transformed data, analysis, and publication outputs distinct.
6. **Bilingual readiness:** use UTF-8 throughout and retain authoritative Traditional Chinese names alongside translations.

## Getting started

1. Read [`docs/README.md`](docs/README.md) and [`docs/research-protocol.md`](docs/research-protocol.md).
2. Review the current priorities in [`ROADMAP.md`](ROADMAP.md).
3. Add research questions and source notes under `research/`.
4. Register new datasets before placing files in `data/`.
5. Record user-visible or methodological changes in [`CHANGELOG.md`](CHANGELOG.md).

Tooling and environment setup will be documented once the analysis and publishing stacks are selected.

## Data and licensing

The repository's original software and documentation are licensed under the [MIT License](LICENSE). Third-party data and source materials may have separate terms; document those terms and provenance in the relevant data or source register. The MIT license does not override third-party rights.

## Status

The project is in its foundation phase. Research questions, source criteria, the data schema, and publication tooling are the next decision points.
