# CSV Data Layer

These UTF-8 CSV files are the flat, analysis-friendly interchange layer. Each file contains a header row and representative records.

`CommunityProfile.csv` contains three source-backed community profiles. Records in the other five files are explicitly marked `is_example=true` and `data_quality_flag=synthetic_example`; they demonstrate relationships and field types and must not be cited as research findings.

Canonical column definitions are in `data/schema/*.schema.json` and `docs/data-dictionary.md`.
