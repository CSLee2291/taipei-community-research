# Sprint 17 — 研究 Dashboard 完成版

狀態：規格已建立，尚未執行。

## 目標

完成可搜尋、比較、呈現地圖、KPI、圖表與研究限制的響應式 Dashboard。

## 功能

- 研究總覽與 KPI
- 社區地圖
- 圖表與時間軸
- 排名資格與信心
- 社區比較
- 手機、平板與桌面響應式介面

## 技術原則

1. 延伸既有 Node.js、React、vinext 與 Google Maps，不以範例技術棧重寫已驗證功能。
2. Bootstrap 5 與 Chart.js 只在有明確維護效益時導入。
3. Leaflet 只能作為無 API Key 的公開地圖替代方案，需保留 Google Maps 整合。
4. 所有正式視覺化排除合成資料，並顯示資料日期、來源與限制。

## 驗收條件

- 建置、測試、lint、鍵盤操作、色彩對比及跨裝置檢查通過。
- 圖表數字與同版 CSV／JSON／報告一致。
- 無資料、資料不足與零值的介面狀態清楚區分。

## 完成流程

更新 README、CHANGELOG、ROADMAP，建立單一 Sprint commit 與 Pull Request；不得開始 Sprint 18。
