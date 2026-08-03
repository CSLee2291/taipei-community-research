# CSV 資料層

這些 UTF-8 CSV 是適合人工檢閱與分析的平面交換資料。每個檔案包含標題列與代表性紀錄。

`CommunityProfile.csv` 目前有 33 筆具政府來源的萬華區正式 Profile；`CommunityActivities.csv` 有 50 筆 2023–2026 政府核定方案紀錄。`CommunitySDGs.csv` 對每筆活動提供一筆 `draft` 候選，但全部待人工覆核且不得視為正式 SDG 成效。獎項、補助與 AI 排名檔案仍明確標示 `is_example=true` 與 `data_quality_flag=synthetic_example`，只用於展示資料模型。

正式欄位定義位於 `data/schema/*.schema.json` 與 `docs/data-dictionary.md`。
