# SDG 人工審查資料

本目錄保存研究者手動輸入的結構化審查決策。`CommunitySDGReviews.csv` 是人工審查的唯一來源，不得由候選產生器或合併腳本覆寫。

## 決策

- `pending`：尚未審查，所有人工欄位保持空白。
- `accept`：接受原候選；需填入與候選相同的目標、細項與對應類型。
- `modify`：修改候選；至少一項目標、細項或對應類型必須與原候選不同。
- `reject`：拒絕候選，不進入正式映射。
- `defer`：已檢視但證據不足，保留草稿並建立後續研究 TODO。

除 `pending` 外，均須填寫審查理由、審查角色與日期。`accept`、`modify` 另須填寫審查後對應、信心值、證據層級、證據標題與 URL。不得填入非必要真實姓名或其他私人資料。

## 產生發布資料

```bash
node research/scripts/build-community-sdg-candidates.mjs
node research/scripts/merge-community-sdg-reviews.mjs
node research/scripts/validate-data-layer.mjs
```

第一支腳本只重建可重製的 AI 候選；第二支腳本讀取本目錄的人工決策並產生 `data/csv/CommunitySDGs.csv`、JSON、統計、文件與 Dashboard 資料。
