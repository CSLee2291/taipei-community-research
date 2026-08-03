# 研究資料

研究資料依生命週期分層。資料集在來源、敏感性、授權與發布狀態完成審查前，不應直接提交或公開。

## 目錄

- `schema/`：版本化表格模板、欄位限制與整合 Profile schema。
- `external/`：從專案外取得且保持原樣的第三方資料。
- `raw/`：不可變更的第一手蒐集輸出或來源快照。
- `interim/`：暫時性正規化、關聯或補充資料。
- `processed/`：通過驗證、可分析或核准發布的資料。
- `csv/`：含代表性紀錄的 UTF-8 平面表格交換層。
- `json/`：與 CSV 層同步的型別化 JSON 發布層。

六組應用資料集是 `CommunityProfile`、`CommunityActivities`、`CommunityAwards`、`CommunitySDGs`、`CommunityFunding` 與 `CommunityAIRanking`。機器可讀契約位於 `schema/*.schema.json`，人工可讀定義位於 `docs/data-dictionary.md`。

`CommunityProfile` 與 `CommunityActivities` 已發布正式來源紀錄；活動層的統計單位是官方核定方案，不是完成場次。`CommunitySDGs` 由可重製候選與 `research/reviews/CommunitySDGReviews.csv` 合併產生；目前 50 筆審查決策均為 `pending`，正式映射數仍為 0。`is_example=true` 或 `data_quality_flag=synthetic_example` 的紀錄只用於展示資料模型，必須排除於研究結論、Dashboard 正式統計與公開排名。

```bash
node research/scripts/validate-data-layer.mjs
node research/scripts/build-community-activities.mjs
node research/scripts/build-community-sdg-candidates.mjs
node research/scripts/merge-community-sdg-reviews.mjs
```

## 資料集要求

每組資料應附 metadata，記錄標題、穩定 ID、來源、發布者、存取日、授權、蒐集方法、時間範圍、schema 版本、編碼、轉換 lineage、敏感性、發布決策與已知限制。

未建立核准的保存與存取計畫前，不得提交秘密、個人資料、限制資料或大型二進位資料集。
