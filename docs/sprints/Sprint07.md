# Sprint 07 — 社區完整檔案

狀態：規格已建立，尚未執行。

## 目標

為萬華區每個社區發展協會建立可追溯、格式一致的完整 Markdown 檔案。

## 任務

1. 先閱讀專案規範並確認 Sprint 06 的主檔與查核報告已通過審查。
2. 在 `communities/wanhua/` 為每個協會建立穩定檔名的頁面。
3. 每頁包含歷史、社區特色、社區治理、政府肯定、來源與已知限制。
4. 只使用具授權與 provenance 的照片；沒有可再利用照片時建立 TODO，不以網路圖片補位。
5. 自動產生社區摘要表，並驗證頁面數與主檔母體一致。
6. 更新 README、CHANGELOG 與 ROADMAP。

## 交付

- `communities/wanhua/<community>.md`
- 社區摘要表
- 頁面產生與一致性檢查

## 驗收條件

- 每個頁面可回溯至 `community_id` 及正式來源。
- 事實、組織自述與研究詮釋清楚區分。
- 圖片具有來源、授權、替代文字與必要圖說。
- 缺值與未驗證內容列為 TODO，不由 AI 補寫。

## 完成流程

建立單一 Sprint commit 與 Pull Request；不得開始 Sprint 08。
