# Wanhua Community Development Associations — Government Source Register

Status: Verified source selection

Access date: 2026-08-03

## Coverage definition

For this release, “all Taipei Wanhua Community Development Associations” means every row in the current consolidated Taipei City association dataset whose official administrative district code is `63000070`. The source contains 371 Taipei records, of which 31 meet that rule.

This is a dataset-defined inventory, not an independent legal determination of whether an organization is currently operating. The dataset does not publish a dedicated operational-status field.

## Primary source

### Taipei City community development association dataset

- Official title: [臺北市社區發展服務_社區發展協會](https://data.taipei/dataset/detail?id=e81a07f7-8137-4019-a96f-210a00ef72a3)
- Publisher: Taipei City Government Department of Social Welfare
- Dataset ID: `e81a07f7-8137-4019-a96f-210a00ef72a3`
- Resource ID: `654f0abf-b859-4a1d-8dcd-28c733313c1c`
- Published format: CSV
- Resource update displayed by publisher: 2026-03-31 15:13:03
- Metadata update displayed by publisher: 2026-03-31 15:46:58
- Update frequency: irregular
- License: [Open Government Data License, Version 1.0](https://data.taipei/rule)
- Research use: authoritative inventory and source for association name, district code, address, registration, establishment date, coordinates, agency fields, and source upload date

The license permits reuse and adaptation without a royalty, subject to attribution. The repository preserves an unchanged snapshot and provides explicit attribution with derivative outputs.

## Government cross-checks

### Wanhua District Office association list

- Page: [萬華區社區發展協會一覽表](https://whdo.gov.taipei/News_Content.aspx?n=C0AA7DA1A318888E&s=E6F2F710D4BA58ED&sms=9CDDA66829FF2249)
- Listing page: [社區發展協會](https://whdo.gov.taipei/News.aspx?n=C0AA7DA1A318888E&sms=9CDDA66829FF2249)
- Publisher: Taipei City Wanhua District Office
- Listing date shown by the publisher: 2026-02-12 (ROC year 115)
- Research use: independent government cross-check of the existence of a current district-level list

### Historical Wanhua-specific dataset

- Dataset: [臺北市社區發展服務_社區發展協會(萬華)](https://data.taipei/dataset/detail?id=820c1c94-67ae-491b-a6cc-34a1bd247b73)
- Publisher: Taipei City Government Department of Social Welfare
- Published format: XML
- Resource update displayed by publisher: 2024-12-20 16:08:24
- Research use: historical metadata and field-definition cross-check only

The consolidated CSV is used as the primary source because its published resource date is later and it provides one consistent citywide schema.

## Transformation rules

1. Filter rows by exact district code `63000070`.
2. Preserve the full official association name in `association_name_zh`.
3. Derive a short community label only by removing the fixed prefix `臺北市萬華區` and suffix `社區發展協會`; preserve the original name separately.
4. Convert ROC dates in `YYYMMDD` form to Gregorian ISO 8601 dates by adding 1911 to the year.
5. Parse coordinates as decimal numbers; empty coordinates remain null.
6. Assign stable project identifiers from the maintained name-to-ID mapping; additions or renames require manual review before regeneration.
7. Treat blank source cells as unknown, never as zero or a negative finding.
8. Do not infer operational status from dataset inclusion; use `unknown` unless another authoritative source explicitly states a status.
9. Exclude chairperson names, direct telephone numbers, fax numbers, and email addresses from public derivatives under the project’s data-minimization policy.

## Known limitations

- Source upload dates vary by record and can be much older than the resource publication date.
- Blank registration, establishment, or coordinate values are retained as missing.
- The dataset describes registered associations and contact information, not activities, funding, awards, membership, service quality, or current operating capacity.
- Multiple associations can refer to the same neighborhood or address area; records are not deduplicated by village name.
- A district-level government page can change between snapshots. Future releases should repeat the cross-check and document additions, removals, and renamed associations.
