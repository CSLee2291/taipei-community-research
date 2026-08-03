# 研究資料庫 Schema

版本：1.1.0

狀態：使用中的研究資料層

本目錄定義臺北社區研究的正規化交換 schema。原有 CSV 是只有欄名的正規化模板；六個 `*.schema.json` 定義 `data/csv/` 與 `data/json/` 應用發布層的契約。`CommunityProfile.json` 則保留為整合 Profile API schema。

## 應用資料層

| Schema | CSV／JSON 資料集 | 用途 |
| --- | --- | --- |
| `CommunityProfile.schema.json` | `CommunityProfile` | 具來源的社區身分與 provenance |
| `CommunityActivities.schema.json` | `CommunityActivities` | 計畫、服務與活動 |
| `CommunityAwards.schema.json` | `CommunityAwards` | 具證據的獎項與肯定 |
| `CommunitySDGs.schema.json` | `CommunitySDGs` | 可覆核的 SDG 對應評估 |
| `CommunityFunding.schema.json` | `CommunityFunding` | 補助申請、核定與支出 |
| `CommunityAIRanking.schema.json` | `CommunityAIRanking` | 版本化、可解釋的評估輸出 |

## 正規化表格

| 檔案 | 資料粒度 | 主鍵 | 上層鍵 |
| --- | --- | --- | --- |
| `Community.csv` | 一個社區與其發展協會 | `community_id` | — |
| `CommunityActivity.csv` | 一個計畫、事件、服務或週期活動 | `activity_id` | `community_id` |
| `CommunitySDGs.csv` | 一個具證據的 SDG 對應 | `community_sdg_id` | `community_id`、可選 `activity_id` |
| `CommunityAwards.csv` | 一筆公開獎項或肯定 | `award_id` | `community_id`、可選 `activity_id` |
| `CommunityFunding.csv` | 一筆補助申請、核定或支持 | `funding_id` | `community_id`、可選 `activity_id` |

## 關聯

- `Community` 是上層實體。
- `CommunityActivity` 對 `Community` 是多對一。
- SDG、獎項與補助紀錄屬於一個社區，也可另外指向一個活動。
- `CommunityProfile.json` 將單一社區與相關陣列組成發布／API 格式，不取代正規化儲存。

## 識別碼

穩定專案 ID 不得重用：

- 社區：`COM-...`
- 活動：`ACT-...`
- SDG 評估：`SDG-...`
- 獎項：`AWD-...`
- 補助：`FND-...`

前綴後只使用大寫 ASCII 字母、數字與連字號。不得把行政區、營運狀態或年度等可變屬性編入穩定 ID。

## 資料規範

- 編碼：UTF-8。
- 欄名：小寫 `snake_case`。
- 日期：ISO 8601 `YYYY-MM-DD`。
- 時間戳：ISO 8601 UTC，通常以 `Z` 結尾。
- 座標：WGS84 十進位。
- 幣別：ISO 4217 三字母代碼；金額不含符號或千分位。
- 未知值：CSV 欄位留空；重大缺值記錄於 `notes` 或 `provenance_note`，不用 `N/A`、`-` 或 `0`。
- 雙語欄位：`_zh` 保留官方繁體中文，只有核准翻譯才填 `_en`。
- 個人資料：不得保存私人聯絡資訊或研究不必要的個人姓名。

## Provenance 與品質

每筆紀錄都包含來源、存取日、生命週期、品質、時間與 schema 版本。只有完成證據與關聯核對後才能標為 `verified`。衍生值或爭議值需在 `provenance_note` 說明，並透過 `data_quality_flag` 標記。

## 完整性規則

1. 主鍵非空且唯一。
2. 每個 `community_id` 外鍵可解析至 `Community.community_id`。
3. 每個已填 `activity_id` 可解析至同一社區的 `CommunityActivity.activity_id`。
4. 結束日不得早於開始日。
5. SDG 目標為 1–17，信心為 0–1。
6. 人數與金額不得為負值。
7. `created_at` 不得晚於 `updated_at`。
8. 發布紀錄必須通過揭露、來源與授權審查。

## Schema 演進

`schema_version` 採語意化版本。不相容欄位或意義變更提升 major；相容新增提升 minor；說明與非結構修正提升 patch。所有變更記錄於 `CHANGELOG.md`，發布新 major 前需提供 migration。
