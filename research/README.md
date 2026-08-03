# 研究工作區

本目錄保存研究問題形成與解釋過程中使用的材料，成熟後再移入正式方法或出版內容。

## 建議內容

- `questions/`：研究問題、假設與範圍說明。
- `sources/`：來源評估與書目筆記；限制來源副本不得放在此處。
- `notes/`：可安全提交且含日期的研究或田野筆記。
- `instruments/`：核准的問卷、訪談指引或蒐集模板。

時間相關檔名使用 ISO 日期，清楚區分觀察與詮釋，長期有效的決策移入 `docs/`。

## 可重現研究管線

- `scripts/build-wanhua-database.mjs`：由官方協會母體來源重建 Sprint 1 Profile 資料、名冊與儀表板資料。
- `scripts/build-community-activities.mjs`：由 2023–2026 年政府核定表轉錄重建 Sprint 2 活動 CSV、JSON、統計、來源查核與儀表板資料。
- `sources/wanhua-community-activity-sources.json`：Sprint 2 官方文件登錄與證據範圍。
- `sources/wanhua-community-activity-approvals-2023-2026.csv`：核定表逐列轉錄；其中預計受益人數不得視為實際參與人次。

執行 Sprint 2 重建：

```bash
node research/scripts/build-community-activities.mjs
```
