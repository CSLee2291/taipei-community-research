# 萬華區活動 SDG 候選對應

產生日期：2026-08-03

Mapping version：1.0.0
狀態：**候選資料，全部待人工覆核**

## 結論

Sprint 3 已為 Sprint 2 的 50 筆核定方案各產生一筆主要 SDG 候選，活動候選覆蓋為 50/50；正式 SDG 對應仍為 **0**。這些候選只用於安排人工審查，不構成 SDG 成效、正式涵蓋率或排名。

## 證據邊界

- 活動來源只證明方案獲核定與預定期間，不證明活動完成或成果。
- 對應規則只使用活動類型與核定名稱；沒有成果指標時，`observed_value` 與 `indicator_name_zh` 保持空值。
- 每筆紀錄均為 `record_status=draft`、`assessment_method=rule_based`、`reviewer_role=ai_assisted_candidate`。
- 正式發布需要研究者逐筆核對目標定義、方案內容、成果證據、反證與限制。

## 規則

| 活動類型 | 候選目標 | 細項 | 對應類型 | 最高信心 |
| --- | --- | --- | --- | ---: |
| `health_promotion` | SDG 3 | 3.4 | direct | 0.45 |
| `education` | SDG 4 | 4.7 | indirect | 0.35 |
| `volunteer_service` | SDG 11 | 11.3 | enabling | 0.35 |
| `culture` | SDG 11 | 11.4 | indirect | 0.3 |
| `care_service` | SDG 10 | 10.2 | indirect | 0.4 |
| `digital_learning` | SDG 4 | 4.4 | direct | 0.45 |
| `youth_engagement` | SDG 10 | 10.2 | indirect | 0.35 |

## 框架來源

- [聯合國 17 項永續發展目標](https://sdgs.un.org/goals)
- [臺灣永續發展目標](https://ncsd.ndc.gov.tw/Fore/SDGList)

完整規則見 [activity-type-to-sdg-candidates.json](../research/mappings/activity-type-to-sdg-candidates.json)，逐筆審查見 [sdg-review-queue.md](sdg-review-queue.md)。
