# JSON Data Layer

Each JSON file is a typed publication of its same-named CSV dataset with envelope metadata:

- `dataset`
- `schema_version`
- `generated_at`
- `record_count`
- `records`

JSON records preserve numeric and boolean types that are represented textually in CSV. The CSV and JSON layers must be regenerated and validated together.
