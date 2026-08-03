# 臺北市社區發展協會研究

這是一個長期、開源且可重製的臺北市社區發展協會研究平台，第一階段聚焦萬華區，研究期間為 2023–2026。

本 Repository 同時是研究資料庫、方法文件、互動式 Dashboard、公開網站與研究報告的單一版本來源。所有正式事實必須有可驗證來源；無法確認的資料維持空白並記錄限制，不使用 AI 推測補齊。

## 目前成果

- 以萬華區公所 2026-02-12 官方名冊確認 33 筆萬華區社區發展協會，並以社會局全市資料交叉比對其中 31 筆。
- 完成 Sprint 1 主檔：33 筆 `CommunityProfile` CSV／JSON、協會清冊、個別 Markdown 檔案與資料品質報告。
- 完成 Sprint 2 活動層：轉錄 2023–2026 臺北市社會局核定表 50 筆方案，涵蓋 18 個協會；其餘 15 個協會列入來源 TODO。
- 建立活動年度／類型統計、33 協會來源覆蓋矩陣、CSV／JSON 與 Dashboard 資料。
- 完成 Sprint 3 待審成果：為 50 筆核定方案各建立一筆低信心 SDG 候選、覆核佇列、候選涵蓋分析與雷達圖；正式映射仍為 0。
- 建立 CSV、JSON、JSON Schema 與六工作表人工檢閱檔。
- 建立 Google Maps 整合的萬華研究 Dashboard。
- 建立資料驗證、JSON 匯出、網站、報告、Release 與 GitHub Pages 工作流程。
- 建立研究方法、資料字典、評分模型與 Sprint 驗收規範。

活動資料已排除合成示例，但目前只證明政府核定與預定期間，不證明方案已完成。SDG 資料是由正式活動衍生的待人工覆核候選，不是合成示例，也不是正式 SDG 成效。獎項、補助與 AI 排名資料仍為合成教學示例。

## 專案入口

| 文件／路徑 | 用途 |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Codex 與研究代理必須遵守的永久規則 |
| [`PROJECT_SPEC.md`](PROJECT_SPEC.md) | 資料、研究、Dashboard、網站、報告與 Release 規格 |
| [`docs/sprints/README.md`](docs/sprints/README.md) | Sprint 1–6 的交付與驗收條件 |
| [`docs/methodology.md`](docs/methodology.md) | 研究方法與證據標準 |
| [`docs/activity-research.md`](docs/activity-research.md) | 2023–2026 活動查核與 33 協會覆蓋矩陣 |
| [`docs/activity-statistics.md`](docs/activity-statistics.md) | 核定方案年度與類型統計 |
| [`docs/sdg-candidate-mapping.md`](docs/sdg-candidate-mapping.md) | SDG 候選規則、證據邊界與框架來源 |
| [`docs/sdg-review-queue.md`](docs/sdg-review-queue.md) | 50 筆待人工覆核候選 |
| [`docs/evaluation-model.md`](docs/evaluation-model.md) | 可解釋評分模型與公平性護欄 |
| [`docs/data-dictionary.md`](docs/data-dictionary.md) | 六組資料集欄位定義 |
| [`ROADMAP.md`](ROADMAP.md) | 目前進度與下一階段 |
| [`CHANGELOG.md`](CHANGELOG.md) | 可追蹤的專案變更 |

## Repository 結構

| 路徑 | 用途 |
| --- | --- |
| `data/` | 外部、原始、schema、CSV、JSON 與處理後研究資料 |
| `docs/` | 方法、資料字典、評分、Sprint 與治理文件 |
| `dashboard/` | 互動式研究 Dashboard |
| `website/` | GitHub Pages 靜態網站 |
| `report/` | 萬華研究報告與 33 份協會檔案 |
| `research/` | 來源登錄、ID 映射與研究轉換程式 |
| `scripts/` | Repository 層級自動化入口說明 |
| `.github/workflows/` | CI/CD、資料驗證、報告與部署 |

## 本機驗證

需要 Node.js 22.13 以上；報告圖表與出版流程使用 Python 3.12。

```bash
node research/scripts/check-markdown-links.mjs
node research/scripts/validate-data-layer.mjs
node research/scripts/export-data-layer-json.mjs --check
node research/scripts/build-wanhua-database.mjs
node research/scripts/build-community-activities.mjs
node research/scripts/build-community-sdg-candidates.mjs
node research/scripts/build-static-site.mjs

cd dashboard
npm ci
npm test
npm run lint
```

完整資料同步、JSON 匯出、Dashboard artifact、研究報告與 Release 都從 GitHub Actions 的 **Run workflow** 由使用者觸發。研究資料不設定每日自動更新。

## 研究原則

1. 每個正式事實皆可回溯至來源與處理步驟。
2. 來源原值、正規化值與衍生結果分層保存。
3. 查無資料不等於沒有活動或未營運。
4. 合成示例不得進入正式分析、圖表或排名。
5. AI 只能輔助抽取與檢查，正式判斷需人工覆核。
6. 不提交敏感資料、私人聯絡資訊或任何憑證。

## 授權

本 Repository 原創程式與文件採 [MIT License](LICENSE)。第三方資料依其原始授權條款使用；MIT License 不會取代政府開放資料或其他來源的權利與歸屬要求。
