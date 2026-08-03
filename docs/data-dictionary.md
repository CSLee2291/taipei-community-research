# 資料字典

> 本文件與 `data/schema/*.schema.json` 同步產生。CSV 空白值表示未知或不適用；不得使用 `N/A`、`-` 或 `0` 代替缺值。

## 共通約定

- 編碼：UTF-8；欄位名稱：英文 `snake_case`。
- 日期：`YYYY-MM-DD`；時間：UTC ISO 8601；座標：WGS84。
- 金額：新臺幣數值，不含千分位與貨幣符號。
- `is_example=true` 或 `data_quality_flag=synthetic_example` 的資料不得作為研究結論。
- 關聯鍵必須解析至同一資料層的父資料表。

## CommunityProfile

每列代表一個社區發展協會的核心研究檔案。

- 主鍵：`profile_id`

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `profile_id` | string | 是 | 社區檔案穩定識別碼。 | — |
| `community_id` | string | 是 | 跨資料表使用的社區穩定識別碼。 | — |
| `community_name_zh` | string | 是 | 社區中文簡稱。 | — |
| `association_name_zh` | string | 是 | 社區發展協會法定中文名稱。 | — |
| `district_code` | string | 是 | 官方行政區代碼，以文字保存。 | — |
| `district_name_zh` | string | 是 | 行政區中文名稱。 | — |
| `village_name_zh` | string | 否 | 地址所屬里別。 | — |
| `postal_code` | string | 否 | 郵遞區號，以文字保存。 | — |
| `address_zh` | string | 否 | 政府名冊公布的協會地址。 | — |
| `latitude` | number | 否 | WGS84 緯度十進位值。 | — |
| `longitude` | number | 否 | WGS84 經度十進位值。 | — |
| `established_date` | date | 否 | 協會成立日期。 | `YYYY-MM-DD` |
| `registration_number` | string | 否 | 政府立案字號。 | — |
| `term_number` | integer | 否 | 名冊所載屆次。 | — |
| `organization_status` | string | 是 | 經證據支持的組織狀態；未提供時為 unknown。 | `active`、`inactive`、`dissolved`、`unknown` |
| `source_dataset_title` | string | 是 | 主要來源資料集名稱。 | — |
| `source_url` | uri | 是 | 主要來源資料集網址。 | 絕對 URL |
| `source_resource_updated_at` | datetime | 是 | 來源資源更新時間。 | ISO 8601 |
| `source_accessed_on` | date | 是 | 研究團隊取得來源的日期。 | `YYYY-MM-DD` |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、限制或資料處理註記。 | — |
## CommunityActivities

每列代表一項社區活動、服務或持續性方案。

- 主鍵：`activity_id`
- 外鍵：`community_id` → `CommunityProfile.community_id`

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `activity_id` | string | 是 | 活動穩定識別碼。 | — |
| `community_id` | string | 是 | 所屬社區識別碼。 | — |
| `activity_name_zh` | string | 是 | 活動或方案中文名稱。 | — |
| `activity_type_code` | string | 是 | 受控活動類別代碼。 | `health_promotion`、`education`、`volunteer_service`、`culture`、`ecology`、`disaster_preparedness`、`care_service`、`digital_learning`、`youth_engagement`、`food_support`、`environment`、`other` |
| `description_zh` | string | 否 | 活動內容的事實性中文摘要。 | — |
| `start_date` | date | 否 | 活動或方案開始日期。 | `YYYY-MM-DD` |
| `end_date` | date | 否 | 活動或方案結束日期。 | `YYYY-MM-DD` |
| `recurring` | boolean | 是 | 是否為週期性活動。 | `true`、`false` |
| `venue_name_zh` | string | 否 | 活動場地名稱。 | — |
| `address_zh` | string | 否 | 活動地址。 | — |
| `participant_count` | integer | 否 | 有成果證據支持的實際參與人次；核定表的預計受益人數不得填入。 | — |
| `target_groups` | string | 否 | 目標對象代碼，以分號分隔。 | — |
| `evidence_level` | string | 是 | 活動存在與成果的證據層級。 | `A`、`B`、`C`、`D` |
| `source_title` | string | 否 | 活動資料來源名稱。 | — |
| `source_url` | uri | 否 | 活動資料來源網址。 | 絕對 URL |
| `source_accessed_on` | date | 否 | 來源存取日期。 | `YYYY-MM-DD` |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、原始期間、核定表定位資訊、預計受益人數與證據限制。 | — |

## CommunityAwards

每列代表一項可驗證的獎項、表揚或競賽結果。

- 主鍵：`award_id`
- 外鍵：`community_id` → `CommunityProfile.community_id`；`activity_id` → `CommunityActivities.activity_id`（可空白）

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `award_id` | string | 是 | 獎項紀錄穩定識別碼。 | — |
| `community_id` | string | 是 | 獲獎社區識別碼。 | — |
| `activity_id` | string | 否 | 相關活動識別碼。 | — |
| `award_name_zh` | string | 是 | 獎項中文名稱。 | — |
| `awarding_body_zh` | string | 是 | 頒獎單位中文名稱。 | — |
| `award_level` | string | 是 | 獎項層級。 | `community`、`district`、`city`、`national`、`international`、`other` |
| `award_category_zh` | string | 否 | 獎項分類。 | — |
| `awarded_date` | date | 否 | 頒發日期。 | `YYYY-MM-DD` |
| `award_year` | integer | 是 | 頒發西元年份。 | — |
| `rank_or_result` | string | 否 | 名次或結果文字。 | — |
| `evidence_url` | uri | 否 | 官方得獎證明網址。 | 絕對 URL |
| `source_title` | string | 否 | 獎項資料來源名稱。 | — |
| `source_accessed_on` | date | 否 | 來源存取日期。 | `YYYY-MM-DD` |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、限制或資料處理註記。 | — |

## CommunitySDGs

每列代表一項有證據鏈的社區或活動 SDG 對應評估。

- 主鍵：`community_sdg_id`
- 外鍵：`community_id` → `CommunityProfile.community_id`；`activity_id` → `CommunityActivities.activity_id`（可空白）

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `community_sdg_id` | string | 是 | SDG 評估穩定識別碼。 | — |
| `community_id` | string | 是 | 受評社區識別碼。 | — |
| `activity_id` | string | 否 | 相關活動識別碼。 | — |
| `sdg_goal` | integer | 是 | 聯合國永續發展目標編號 1–17。 | — |
| `sdg_target` | string | 否 | SDG 細項目標代碼，例如 3.4。 | — |
| `alignment_type` | string | 是 | 貢獻類型。 | `direct`、`indirect`、`enabling` |
| `evidence_summary_zh` | string | 是 | 支持此對應的中文證據摘要。 | — |
| `indicator_name_zh` | string | 否 | 使用的成果指標名稱。 | — |
| `observed_value` | number | 否 | 觀測值。 | — |
| `observed_unit` | string | 否 | 觀測值單位。 | — |
| `confidence_score` | number | 是 | 對應信心水準，0–1；未人工覆核候選不得高於 0.5。 | — |
| `assessment_method` | string | 是 | 評估方式。 | `rule_based`、`human_review`、`mixed` |
| `assessed_on` | date | 是 | 評估日期。 | `YYYY-MM-DD` |
| `reviewer_role` | string | 是 | 審核者角色；AI 輔助候選使用 `ai_assisted_candidate`，不保存非必要姓名。 | — |
| `source_title` | string | 否 | 證據來源名稱。 | — |
| `source_url` | uri | 否 | 證據來源網址。 | 絕對 URL |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、限制或資料處理註記；未覆核候選必須明示「待人工覆核」。 | — |

### SDG 候選發布規則

- `rule_based` 且未人工覆核的紀錄只能是 `draft`。
- 候選可源自真實活動，因此 `is_example=false`；但候選數不得視為正式涵蓋或成效。
- 沒有活動成果證據時，`indicator_name_zh`、`observed_value` 與 `observed_unit` 保持空值。
- 只有人工覆核後才可使用 `human_review` 或 `mixed`，並需記錄覆核角色、日期與理由。

## CommunityFunding

每列代表一項申請、核定或執行中的資金紀錄。

- 主鍵：`funding_id`
- 外鍵：`community_id` → `CommunityProfile.community_id`；`activity_id` → `CommunityActivities.activity_id`（可空白）

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `funding_id` | string | 是 | 資金紀錄穩定識別碼。 | — |
| `community_id` | string | 是 | 受資助社區識別碼。 | — |
| `activity_id` | string | 否 | 相關活動識別碼。 | — |
| `fiscal_year` | integer | 是 | 會計年度，使用西元。 | — |
| `program_name_zh` | string | 是 | 補助或資助計畫名稱。 | — |
| `funder_name_zh` | string | 是 | 資助單位名稱。 | — |
| `funding_type` | string | 是 | 資金類型。 | `grant`、`subsidy`、`donation`、`self_funded`、`in_kind`、`other` |
| `funding_status` | string | 是 | 資金流程狀態。 | `applied`、`approved`、`rejected`、`active`、`completed`、`cancelled`、`unknown` |
| `award_date` | date | 否 | 核定日期。 | `YYYY-MM-DD` |
| `period_start` | date | 否 | 執行期間開始日。 | `YYYY-MM-DD` |
| `period_end` | date | 否 | 執行期間結束日。 | `YYYY-MM-DD` |
| `amount_requested_twd` | number | 否 | 申請金額，新臺幣。 | — |
| `amount_awarded_twd` | number | 否 | 核定金額，新臺幣。 | — |
| `cofunding_twd` | number | 否 | 共同出資金額，新臺幣。 | — |
| `reported_spend_twd` | number | 否 | 公開報告支出金額，新臺幣。 | — |
| `public_record_identifier` | string | 否 | 政府公開紀錄識別碼。 | — |
| `source_title` | string | 否 | 資金資料來源名稱。 | — |
| `source_url` | uri | 否 | 資金資料來源網址。 | 絕對 URL |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、限制或資料處理註記。 | — |

## CommunityAIRanking

每列代表一個社區於特定評估期間及模型版本下的可稽核評分。

- 主鍵：`ranking_id`
- 外鍵：`community_id` → `CommunityProfile.community_id`

| 欄位 | 型別 | 必填 | 說明 | 允許值／格式 |
| --- | --- | --- | --- | --- |
| `ranking_id` | string | 是 | 評分紀錄穩定識別碼。 | — |
| `community_id` | string | 是 | 受評社區識別碼。 | — |
| `evaluation_period_start` | date | 是 | 評估期間開始日。 | `YYYY-MM-DD` |
| `evaluation_period_end` | date | 是 | 評估期間結束日。 | `YYYY-MM-DD` |
| `model_version` | string | 是 | 評分模型版本。 | — |
| `eligibility_status` | string | 是 | 是否符合正式排名資格。 | `eligible`、`provisional`、`ineligible` |
| `profile_completeness_score` | number | 是 | 基本資料完整性分數，0–100，權重 20%。 | — |
| `community_participation_score` | number | 是 | 社區參與分數，0–100，權重 20%。 | — |
| `sdg_impact_score` | number | 是 | SDG 與公共價值分數，0–100，權重 25%。 | — |
| `governance_score` | number | 是 | 治理與透明度分數，0–100，權重 20%。 | — |
| `resource_sustainability_score` | number | 是 | 資源永續分數，0–100，權重 15%。 | — |
| `total_score` | number | 是 | 五構面加權總分，0–100。 | — |
| `rank_scope` | string | 是 | 排名比較母體或範圍。 | — |
| `rank_position` | integer | 否 | 同一範圍內名次；不合格者留空。 | — |
| `confidence_score` | number | 是 | 證據充分程度，0–1；不直接改寫總分。 | — |
| `evidence_record_count` | integer | 是 | 納入評分的可追溯證據筆數。 | — |
| `generated_at` | datetime | 是 | 評分產生時間。 | ISO 8601 |
| `model_notes` | string | 是 | 模型限制、缺值與人工覆核說明。 | — |
| `source_methodology_url` | string | 是 | 評分方法文件的專案相對路徑或網址。 | — |
| `record_status` | string | 是 | 資料生命週期狀態。 | `draft`、`verified`、`derived`、`archived` |
| `data_quality_flag` | string | 是 | 資料品質或證據限制標記。 | `none`、`incomplete`、`low_evidence`、`synthetic_example` |
| `is_example` | boolean | 是 | 是否為教學或結構展示用範例資料。 | `true`、`false` |
| `created_at` | datetime | 是 | 專案紀錄建立時間，使用 UTC ISO 8601。 | ISO 8601 |
| `updated_at` | datetime | 是 | 專案紀錄最後更新時間，使用 UTC ISO 8601。 | ISO 8601 |
| `schema_version` | string | 是 | 此筆紀錄遵循的資料結構版本。 | — |
| `notes` | string | 否 | 補充說明、限制或資料處理註記。 | — |
