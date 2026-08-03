# 臺北市社區發展協會研究專案規格

版本：1.0.0

更新日期：2026-08-03

適用範圍：Repository 全部研究、資料、程式、網站、Dashboard、報告與自動化

## 1. 專案目標

本專案建立臺北市社區發展協會的長期開源研究平台，第一階段以萬華區為研究範圍，研究期間為 2023–2026。平台需同時提供：

- 可追溯的協會基本資料與歷史；
- 活動、補助、獎項、志工、關懷據點與公開成果證據；
- 可解釋的 SDG 對應與研究評分；
- CSV、JSON、Markdown、HTML、DOCX、PDF、SVG 與 PNG 輸出；
- 可搜尋、比較、呈現地圖與圖表的公開介面；
- 可由版本化來源與程式重製的資料處理流程。

目前官方開放資料快照共識別出 31 筆萬華區協會紀錄。這是資料來源的實際結果，不以早期預估的 24–30 筆限制母體。

## 2. 目錄與責任

| 路徑 | 責任 |
| --- | --- |
| `data/external/` | 第三方官方來源快照，原檔保存 |
| `data/raw/` | 經核准的第一手原始資料 |
| `data/schema/` | JSON Schema、欄位與關聯契約 |
| `data/csv/` | CSV 交換與人工檢閱層 |
| `data/json/` | 型別化 JSON 發布層 |
| `data/processed/` | 通過驗證的研究衍生資料 |
| `docs/` | 方法、評分、資料字典、Sprint 與決策 |
| `dashboard/` | 互動式 Dashboard 應用程式 |
| `website/` | GitHub Pages 靜態網站來源與建置結果 |
| `report/` | Markdown 報告、個別協會檔案與出版產物 |
| `research/` | 來源登錄、映射、研究腳本與工作材料 |
| `scripts/` | Repository 層級自動化入口與使用說明 |
| `.github/workflows/` | CI/CD、驗證、匯出、報告、部署與 Release |

## 3. 資料來源與證據

來源依序採用臺北市政府資料開放平台、臺北市政府社會局、萬華區公所、衛生福利部、環境部、協會官方網站與官方 Facebook。政府資料是核心身分與行政事實的首要來源；協會官方頁面可支持活動與組織自述；新聞或研究只作補充。

每筆研究紀錄至少包含：

- 穩定研究識別碼；
- 來源標題、發布者與 URL 或資源 ID；
- 來源更新日與研究存取日；
- 證據等級與資料品質狀態；
- schema 版本及必要限制說明。

來源衝突時保留各版本與判定理由。查無資料時使用空值與 TODO，不以零、否定值或模型推測代替。

## 4. 研究方法

研究流程依 `docs/methodology.md`：

1. 登錄來源、授權與研究範圍；
2. 保存不可變更來源快照與必要校驗資訊；
3. 驗證編碼、欄位、筆數與行政區；
4. 建立穩定 ID，正規化名稱、日期、地址與座標；
5. 以外鍵連結活動、獎項、補助、SDG 與評分；
6. 產生 CSV、JSON 與分析資料；
7. 執行 schema、型別、唯一性、外鍵、期間與合理值檢查；
8. 人工覆核重要衍生結論並記錄限制。

正式報告與圖表不得包含 `is_example=true` 的合成資料。

## 5. SDG Mapping

SDG 對應單位是可驗證活動或成果，不是協會名稱或網路聲量。每筆對應至少記錄：

- `community_id` 與 `activity_id`；
- SDG 目標 1–17；
- 對應理由與成果指標；
- 證據來源與證據等級；
- `confidence_score`；
- 人工覆核狀態。

只出現 SDG 關鍵字不足以支持高信心對應。AI 可以提出候選目標，但未經人工覆核不得列入正式涵蓋率或排名。

## 6. AI 評分規則

正式模型以 `docs/evaluation-model.md` 為唯一規範來源。現行構面為：

| 構面 | 權重 |
| --- | ---: |
| 基本資料完整性 | 20% |
| 社區參與 | 20% |
| SDG 與公共價值 | 25% |
| 治理與透明度 | 20% |
| 資源永續 | 15% |

評分必須同時公布模型版本、評估期間、資格狀態、證據筆數與信心值。資料不足是 `not_scorable`，不是零分。合成示例不得形成正式名次。

## 7. Dashboard 規格

Dashboard 至少包含：

- 全區 KPI 與資料品質指標；
- Google Maps 社區地圖、搜尋、篩選及社區詳情；
- 社區比較、成立年代與活動年度趨勢；
- 活動類型統計；
- SDG 涵蓋與雷達圖；
- AI 評分、資格及信心資訊；
- CSV／JSON 下載與來源連結；
- 手機、平板與桌面響應式介面。

目前技術基礎為 Node.js 22.13、React、vinext 與 Google Maps。Bootstrap 5、Chart.js、DataTables 與 Leaflet 是公開網站或後續功能可採用的標準元件；導入前需確認不會重複現有功能、增加不必要依賴或降低可維護性。

## 8. 網站規格

GitHub Pages 靜態網站必須：

- 使用繁體中文與語意化 HTML；
- 呈現研究範圍、資料日期、來源、限制與下載入口；
- 不需要秘密金鑰即可閱讀核心內容；
- 通過基本鍵盤操作、色彩對比與行動裝置檢查；
- 只發布通過驗證且適合公開的資料；
- 與同版本 Dashboard、報告及 JSON 保持一致。

## 9. 研究報告規格

正式報告需自動產生 Markdown、DOCX 與 PDF，圖表輸出 SVG 與 PNG。至少包含：

1. 執行摘要；
2. 研究範圍與方法；
3. 資料品質與限制；
4. 社區概況；
5. 活動分析；
6. SDG 分析；
7. 符合資格時的 AI 評分與敏感度說明；
8. SWOT 與政策／社區建議；
9. 參考資料與來源清單。

若證據不足，相關章節應明確標示「待研究」，不得以範例資料補齊。

## 10. GitHub Actions

| Workflow | 觸發 | 功能 |
| --- | --- | --- |
| `build.yml` | Push、PR、手動 | 驗證資料、Markdown、Dashboard 與網站 |
| `pages.yml` | main 更新、手動 | Build → Upload Pages Artifact → Deploy |
| `dashboard.yml` | 手動 | 建置及上傳 Dashboard artifact |
| `report.yml` | 手動 | 產生 Markdown、DOCX、PDF、SVG、PNG |
| `validate-data.yml` | 資料 PR／Push、手動 | 檢查 CSV、JSON、外鍵與衍生資料 |
| `export-json.yml` | 手動 | 從 CSV 匯出 JSON 與網站資料 |
| `release.yml` | 手動 | 驗證並建立語意版本 Release |
| `nightly-sync.yml` | 手動 | 完整重建所有研究 artifact；檔名僅為相容保留 |

研究資料不設定每日排程。只有使用者在 GitHub Actions 執行 `Run workflow`，或提交資料相關 PR／Push 時才進行相應工作。Dependabot 每週檢查程式相依套件，不修改研究資料。

## 11. 命名與版本

- Markdown、CSV、JSON：UTF-8。
- 日期：`YYYY-MM-DD`；時間戳採含時區的 ISO 8601。
- 社區 ID：`COM-0001`。
- Profile ID：`PROFILE-COM-0001`。
- 其他實體採類型前綴與固定寬度序號；教學資料需含 `EXAMPLE`。
- JSON Schema：`<Dataset>.schema.json`。
- 發布 JSON：`<Dataset>.json`。
- Release Tag：`vMAJOR.MINOR.PATCH`。
- schema、評分規則或資格母體的不相容變更提升 major 版本。

## 12. Release 驗收

建立 Release 前必須：

- 所有資料驗證通過；
- CSV 與 JSON 同步；
- Dashboard 測試與 lint 通過；
- 網站可建置；
- 報告與資料引用相同版本；
- README、CHANGELOG、ROADMAP 已更新；
- 不含秘密、私人資料或未標示合成資料；
- Release Notes 說明來源截止日、schema／模型版本與已知限制。
