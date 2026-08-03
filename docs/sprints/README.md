# 研究 Sprint 執行手冊

本文件把專案總指令拆成可驗收的研究階段。只有通過驗收條件的 Sprint 才能標示完成。

## 目前狀態

| Sprint | 狀態 | 說明 |
| --- | --- | --- |
| Sprint 1：社區基本資料 | 進行中 | 官方名冊已識別 31 筆；發布層尚需將 31 筆完整同步並補齊可取得的官方欄位 |
| Sprint 2：2023–2026 活動 | 待研究 | 目前活動資料是合成教學示例，不能用於結論 |
| Sprint 3：SDGs | 待研究 | schema 與示例已建立，正式活動證據尚未完成 |
| Sprint 4：AI 評分 | 待研究 | 模型草案已建立，正式評分資格尚未具備 |
| Sprint 5：研究報告 | 基礎完成 | Markdown 與產生流程已有基礎，正式內容須等待 Sprint 2–4 |
| Sprint 6：Dashboard | 原型完成 | 已有 Google Maps、篩選與資料檢視；活動、SDG 與正式排名功能待資料完成 |

## Sprint 1：社區基本資料

目標：建立萬華區全部登記社區發展協會的可追溯基本資料庫。

應蒐集名稱、行政區、地址、成立日期、立案字號、座標、官方組織聯絡管道、社區類型、會員／志工、關懷據點、政府評鑑與來源。負責人、電話與電子郵件只有在官方來源明確作為組織公開聯絡資料時才可收錄。

交付：

- `data/csv/CommunityProfile.csv`
- `data/json/CommunityProfile.json`
- `docs/community-list.md`
- README 進度與來源說明

驗收：

- 以官方資料實際筆數為準，目前應為 31 筆；
- 所有缺值維持空白並列入 TODO；
- 每筆至少一個 A 級政府來源；
- CSV、JSON、schema 與處理後資料一致；
- 資料驗證及人工抽查通過。

建議 Commit：`Sprint 1: initialize community profile database`

## Sprint 2：2023–2026 活動

目標：逐一研究 31 個協會在 2023–2026 年間可驗證的活動。

活動分類：健康、教育、志工、文化、生態、防災、社區照顧、數位學習、青年、食物與環境。新增分類前需更新資料字典。

交付：

- `CommunityActivities.csv` 與 JSON；
- 年度趨勢、類型統計與活動摘要；
- 每個協會的 Markdown 更新；
- 未取得資料的協會 TODO。

驗收：每筆活動有日期或明確期間、分類、來源、存取日及證據等級；合成示例全部排除於正式統計。

建議 Commit：`Sprint 2: add verified community activities`

## Sprint 3：SDG 對應

目標：依活動證據建立可解釋、可人工覆核的 SDG 對應。

交付：

- `CommunitySDGs.csv` 與 JSON；
- SDG 涵蓋分析、社區比較與雷達圖；
- Dashboard 與網站 SDG 區塊。

驗收：每筆對應包含活動外鍵、理由、證據、信心與覆核狀態；未覆核 AI 建議不得發布。

建議 Commit：`Sprint 3: map verified activities to SDGs`

## Sprint 4：AI 評分

目標：依 `docs/evaluation-model.md` 建立具資格門檻、證據信心與公平性檢查的研究評分。

交付：

- `CommunityAIRanking.csv` 與 JSON；
- 排名、構面、信心與資格視覺化；
- 敏感度與偏誤分析。

驗收：只有 `eligible` 且經人工覆核者可列正式名次；資料不足者標示 `not_scorable`，不可給零分。

建議 Commit：`Sprint 4: implement evidence-based community evaluation`

## Sprint 5：研究報告

目標：產生一致版本的 Markdown、DOCX、PDF、SVG 與 PNG 研究成果。

交付內容包含執行摘要、方法、社區概況、活動、SDG、合格排名、SWOT、建議、限制與參考資料。

驗收：報告可由版本化資料重建、引用可追溯、表格與圖表一致，且不含合成資料。

建議 Commit：`Sprint 5: generate reproducible research report`

## Sprint 6：Dashboard 與 GitHub Pages

目標：完成可搜尋、比較、呈現地圖與研究分析的響應式介面。

交付：

- KPI、搜尋、篩選、社區詳情與比較；
- Google Maps 與必要時的 Leaflet 無金鑰替代；
- 活動統計、SDG、評分與信心資訊；
- GitHub Pages 自動部署。

驗收：建置、測試、lint、行動裝置與基本無障礙檢查通過，公開資料與同版報告一致。

建議 Commit：`Sprint 6: publish interactive research dashboard`

## 全自動研究模式的安全界線

Repository 穩定後，代理可以持續處理 ROADMAP 中已具明確來源與驗收條件的項目，但不得自行擴張研究範圍、發布未覆核排名、猜測缺值、取得未授權資料或跳過 Pull Request 審查。遇到缺少官方資料、登入權限、人工覆核或方法決策時，建立 TODO 並停止該項，不得假裝完成。
