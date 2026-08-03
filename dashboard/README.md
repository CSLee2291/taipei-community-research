# 萬華社區研究 Dashboard

本 Dashboard 以繁體中文呈現專案資料庫中的 31 筆萬華區社區發展協會紀錄。

## 功能

- 明確說明涵蓋與完整度定義的摘要 KPI；
- 使用政府發布經緯度的 Google Maps 整合；
- 地圖選取、協會標記、位置與大眾運輸路線同步；
- 成立年代分布；
- 名稱、里別、資料品質與排序控制；
- 含來源 provenance 的協會詳情；
- 可下載的最小化個資 JSON；
- 響應式與鍵盤可操作介面。

## 更新資料

開發或發布 Dashboard 前，在 Repository 根目錄執行：

```bash
node research/scripts/build-wanhua-database.mjs
```

程式會驗證官方來源快照，重建研究報告與處理後資料庫，再同步 Dashboard 內建及公開下載的 JSON。

## 本機開發

```bash
npm install
npm run dev
```

執行 `npm test` 可完成部署建置與渲染輸出檢查。

### Google Maps 模式

沒有金鑰時，Dashboard 仍可使用嵌入式 Google 地圖顯示選取的協會，並提供 Maps 搜尋與路線連結。若要顯示篩選結果的互動式多點標記，需啟用 Maps JavaScript API，並在本機或 Sites 正式環境設定 `GOOGLE_MAPS_API_KEY`。瀏覽器金鑰必須限制為 Dashboard 授權的 HTTP referrer。

## 資料歸屬

來源：臺北市政府社會局，2026，「臺北市社區發展服務_社區發展協會」。政府資料依政府資料開放授權條款第 1 版使用。
