# 專案自動化入口

本目錄保留給 Repository 層級的操作入口，例如完整驗證、發布與 Release 編排。

目前可執行的研究轉換程式位於 `research/scripts/`，並由 `.github/workflows/` 呼叫。為避免重複邏輯，在需要穩定的跨工具命令介面前，不建立內容相同的包裝腳本。

## 現有主要命令

```bash
node research/scripts/check-markdown-links.mjs
node research/scripts/validate-data-layer.mjs
node research/scripts/export-data-layer-json.mjs --check
node research/scripts/build-wanhua-database.mjs
node research/scripts/build-static-site.mjs

cd dashboard
npm ci
npm test
npm run lint
```

資料匯出、完整同步、報告產生與 Release 可由 GitHub Actions 頁面手動執行。
