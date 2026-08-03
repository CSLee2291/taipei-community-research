# 變更紀錄

本專案所有重要變更都記錄於此。格式參考 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)，開始發布版本化成果後採用[語意化版本](https://semver.org/lang/zh-TW/)。

## [尚未發布]

### 新增

- Codex 專案總指令 `AGENTS.md`，規範繁體中文、官方來源、禁止捏造、合成資料隔離及里程碑流程。
- `PROJECT_SPEC.md`，整合研究方法、資料來源、SDG、AI 評分、Dashboard、網站、報告、自動化、命名及 Release 規格。
- Sprint 1–6 執行手冊與真實進度標記，明確區分官方名冊成果、原型與待研究項目。
- 八個 GitHub Actions workflows，涵蓋建置、資料驗證、JSON 匯出、Dashboard、報告、GitHub Pages、Release 與手動完整同步。
- Dependabot 的 GitHub Actions 與 Dashboard npm 每週相依套件檢查。
- Markdown 連結檢查、資料層 JSON 匯出、GitHub Pages 靜態網站及研究報告產生程式。
- Repository 層級 `scripts/` 使用說明與本機驗證入口。
- 長期研究 Repository 結構、授權、專案目標、工作原則與資料處理指引。
- 社區、活動、SDG、獎項、補助的正規化 CSV schema 與整合 Profile JSON Schema。
- 版本化臺北市政府開放資料快照、萬華來源登錄與穩定 ID 映射。
- 萬華區公所 2026-02-12 官方名冊快照、隱私最小化轉錄及檔案校驗資訊。
- Sprint 1 萬華區 33 筆 `CommunityProfile` CSV／JSON、協會清冊、處理後 JSON、研究總覽、資料品質報告與個別協會檔案。
- 萬華互動式研究 Dashboard，包含篩選、座標、時間分布、資料詳情與 JSON 下載。
- Google Maps 同步選取、多點標記、位置與大眾運輸路線整合。
- CSV、JSON、JSON Schema、原始資料規範、六工作表檢閱檔、研究方法、評分模型與資料字典。

### 變更

- README、ROADMAP、研究協定及各工作區入口文件改為繁體中文。
- README、ROADMAP、研究方法與來源登錄依區公所 33 筆官方名冊及社會局 31 筆交叉比對結果更新。
- 地址在兩個官方來源間不一致時，不沿用全市資料的舊址座標；缺值與待定位項目改以 TODO 揭露。
- 研究資料完整同步、匯出、Dashboard 與報告更新改為使用者手動觸發，不設定每日資料排程。
- 修正 Dashboard Sites Vite plugin 被 `.gitignore` 排除、導致乾淨 GitHub Actions runner 無法建置的問題。
