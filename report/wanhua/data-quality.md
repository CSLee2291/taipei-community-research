# 萬華區社區發展協會資料品質報告

資料版本：1.1.0

檢查日期：2026-08-03

## 結論

區公所最新名冊共有 33 筆；其中 31 筆可由社會局全市 CSV 交叉比對，2 筆僅出現在區公所名冊。座標缺 18 筆、成立日期缺 5 筆、立案字號缺 6 筆。

## 完整性

| 欄位組 | 有值 | 缺值 | 完整率 |
| --- | ---: | ---: | ---: |
| 經緯度（兩者皆有且地址一致） | 15 | 18 | 45.5% |
| 成立日期 | 28 | 5 | 84.8% |
| 立案字號 | 27 | 6 | 81.8% |
| 三項核心欄位皆完整 | 15 | 18 | 45.5% |

## 需注意的紀錄

| ID | 協會簡稱 | 缺少欄位 |
| --- | --- | --- |
| COM-0002 | 富福 | `coordinates` |
| COM-0005 | 中正新城 | `coordinates` |
| COM-0008 | 忠恕 | `coordinates` |
| COM-0009 | 全德家園 | `coordinates` |
| COM-0010 | 保德 | `coordinates` |
| COM-0011 | 壽德 | `coordinates` |
| COM-0014 | 糖廍 | `established_date`、`registration_number`、`coordinates` |
| COM-0017 | 綠堤 | `coordinates` |
| COM-0018 | 日祥 | `coordinates` |
| COM-0019 | 南一 | `registration_number`、`coordinates` |
| COM-0022 | 新和七普拉斯 | `coordinates` |
| COM-0026 | 忠德友善 | `established_date`、`registration_number`、`coordinates` |
| COM-0027 | 忠德 | `coordinates` |
| COM-0028 | 我愛加蚋錦德 | `coordinates` |
| COM-0029 | 和平 | `coordinates` |
| COM-0030 | 菜園 | `established_date`、`registration_number`、`coordinates` |
| COM-0032 | 愛在孝德 | `established_date`、`registration_number`、`coordinates` |
| COM-0033 | 西門 | `established_date`、`registration_number`、`coordinates` |

## 解讀限制

- 空值表示官方來源未提供或來源間地址不能安全對應，不代表不存在或為零。
- 區公所名冊的「社區範圍」用於 village 欄位，不推論實際服務範圍。
- 8 筆紀錄因區公所現址與社會局座標來源地址不同，未沿用舊座標。
- 名冊沒有活動、獎項、補助、會員、志工或 SDG 成效資料；本 Sprint 不研究這些項目。

## 驗證規則

- 區公所名冊編號必須連續為 1–33；筆數或名稱變更時停止建置並要求人工檢查。
- 社會局 2026-03-31 快照必須維持 31 筆萬華資料，且全部能對應區公所名冊。
- 協會 ID 唯一；行政區代碼為 63000070。
- CSV、JSON、處理後資料與 Markdown 的 Profile 母體必須同為 33 筆。

資料來源：[萬華區公所官方名冊](https://whdo.gov.taipei/News_Content.aspx?n=C0AA7DA1A318888E&s=E6F2F710D4BA58ED&sms=9CDDA66829FF2249)、[臺北市政府社會局開放資料](https://data.taipei/dataset/detail?id=e81a07f7-8137-4019-a96f-210a00ef72a3)。
