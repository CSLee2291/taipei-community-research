import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const sourcePath = path.join(root, "data/external/taipei-city/2026-03-31/community-development-associations.csv");
const databasePath = path.join(root, "data/processed/wanhua-community-associations.json");
const idMapPath = path.join(root, "research/mappings/wanhua-community-ids.json");
const reportRoot = path.join(root, "report/wanhua");
const profileRoot = path.join(reportRoot, "associations");

const SOURCE_URL = "https://data.taipei/dataset/detail?id=e81a07f7-8137-4019-a96f-210a00ef72a3";
const LICENSE_URL = "https://data.taipei/rule";
const DISTRICT_CODE = "63000070";
const RELEASE_DATE = "2026-08-03";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function rocDateToIso(value) {
  if (!value) return null;
  if (!/^\d{7}$/.test(value)) throw new Error(`Unexpected ROC date: ${value}`);
  const year = Number(value.slice(0, 3)) + 1911;
  const month = value.slice(3, 5);
  const day = value.slice(5, 7);
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== iso) {
    throw new Error(`Invalid ROC date: ${value}`);
  }
  return iso;
}

function nullable(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value) {
  const normalized = nullable(value);
  if (normalized === null) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number: ${value}`);
  return parsed;
}

function villageFromAddress(address) {
  const match = address?.match(/萬華區([^路街巷弄號]{1,12}里)/);
  return match ? match[1] : null;
}

function markdownValue(value, fallback = "未提供") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("|", "\\|");
}

function percent(part, whole) {
  return Math.round((part / whole) * 1000) / 10;
}

const sourceText = (await fs.readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "");
const idMap = JSON.parse(await fs.readFile(idMapPath, "utf8"));
const parsedRows = parseCsv(sourceText);
const headers = parsedRows.shift();
const expectedHeaders = ["機構名稱", "行政區代碼", "理事長", "屆期", "郵遞區號", "地址", "電話", "傳真", "電子郵件", "立案字號", "成立日期", "經度", "緯度", "機關代碼", "提供單位", "上傳日期"];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error("Source CSV headers changed; review the transformation before rebuilding.");
}

const sourceRecords = parsedRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
const wanhuaRows = sourceRecords.filter((record) => record["行政區代碼"] === DISTRICT_CODE);
if (wanhuaRows.length !== 31) {
  throw new Error(`Expected 31 Wanhua records, found ${wanhuaRows.length}.`);
}

const sourceNames = new Set(wanhuaRows.map((record) => record["機構名稱"].trim()));
const unmappedNames = [...sourceNames].filter((name) => !idMap[name]);
const duplicateIds = Object.values(idMap).filter((id, index, ids) => ids.indexOf(id) !== index);
if (unmappedNames.length || duplicateIds.length) {
  throw new Error(`Community ID mapping requires review. Unmapped: ${unmappedNames.join(", ") || "none"}; duplicate IDs: ${duplicateIds.join(", ") || "none"}.`);
}

const communities = wanhuaRows.map((row) => {
  const fullName = row["機構名稱"].trim();
  const establishedDate = rocDateToIso(row["成立日期"]);
  const sourceUploadDate = rocDateToIso(row["上傳日期"]);
  const longitude = nullableNumber(row["經度"]);
  const latitude = nullableNumber(row["緯度"]);
  const registrationNumber = nullable(row["立案字號"]);
  const missing = [
    !establishedDate ? "established_date" : null,
    !registrationNumber ? "registration_number" : null,
    longitude === null || latitude === null ? "coordinates" : null,
  ].filter(Boolean);

  return {
    community_id: idMap[fullName],
    community_name_zh: fullName.replace(/^臺北市萬華區/, "").replace(/社區發展協會$/, ""),
    association_name_zh: fullName,
    district_code: row["行政區代碼"],
    district_name_zh: "萬華區",
    village_name_zh: villageFromAddress(row["地址"]),
    postal_code: nullable(row["郵遞區號"]),
    address_zh: nullable(row["地址"]),
    latitude,
    longitude,
    established_date: establishedDate,
    registration_number: registrationNumber,
    term_number: nullableNumber(row["屆期"]),
    organization_status: "unknown",
    source_record: {
      upload_date: sourceUploadDate,
      upload_date_roc: nullable(row["上傳日期"]),
      agency_code: nullable(row["機關代碼"]),
      providing_unit: nullable(row["提供單位"]),
    },
    provenance: {
      dataset_title: "臺北市社區發展服務_社區發展協會",
      dataset_url: SOURCE_URL,
      dataset_id: "e81a07f7-8137-4019-a96f-210a00ef72a3",
      resource_id: "654f0abf-b859-4a1d-8dcd-28c733313c1c",
      source_resource_updated_at: "2026-03-31T15:13:03+08:00",
      accessed_on: RELEASE_DATE,
    },
    record_status: "verified",
    data_quality_flag: missing.length ? "incomplete" : "none",
    missing_fields: missing,
    schema_version: "1.0.0",
  };
});

const withCoordinates = communities.filter((community) => community.latitude !== null && community.longitude !== null).length;
const withEstablishmentDate = communities.filter((community) => community.established_date !== null).length;
const withRegistration = communities.filter((community) => community.registration_number !== null).length;
const completeCore = communities.filter((community) => community.missing_fields.length === 0).length;
const uniqueVillages = new Set(communities.map((community) => community.village_name_zh).filter(Boolean)).size;
const establishmentYears = communities.map((community) => community.established_date?.slice(0, 4)).filter(Boolean).map(Number);
const decadeCounts = Object.fromEntries([...new Set(establishmentYears.map((year) => Math.floor(year / 10) * 10))].sort().map((decade) => [String(decade), establishmentYears.filter((year) => Math.floor(year / 10) * 10 === decade).length]));

const database = {
  database_version: "1.0.0",
  generated_on: RELEASE_DATE,
  title: "Taipei Wanhua Community Development Associations",
  title_zh: "臺北市萬華區社區發展協會資料庫",
  coverage: {
    rule: `administrative district code equals ${DISTRICT_CODE}`,
    district_code: DISTRICT_CODE,
    district_name_zh: "萬華區",
    source_record_count: sourceRecords.length,
    record_count: communities.length,
  },
  attribution: {
    provider: "臺北市政府社會局",
    dataset_title: "臺北市社區發展服務_社區發展協會",
    dataset_url: SOURCE_URL,
    license: "政府資料開放授權條款-第1版",
    license_url: LICENSE_URL,
    attribution_statement: "臺北市政府社會局 2026，臺北市社區發展服務_社區發展協會。",
  },
  privacy: {
    public_contact_fields_redistributed: false,
    note: "Chairperson names, telephone numbers, fax numbers, and email addresses from the source are excluded from this derivative under the project data-minimization policy.",
  },
  quality_summary: {
    complete_core_records: completeCore,
    coordinate_records: withCoordinates,
    establishment_date_records: withEstablishmentDate,
    registration_number_records: withRegistration,
    unique_address_villages: uniqueVillages,
    earliest_known_establishment_year: Math.min(...establishmentYears),
    latest_known_establishment_year: Math.max(...establishmentYears),
    establishment_decade_counts: decadeCounts,
  },
  communities,
};

await fs.mkdir(path.dirname(databasePath), { recursive: true });
await fs.mkdir(profileRoot, { recursive: true });
await fs.writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");

const overviewRows = communities.map((community) => `| [${community.community_id}](associations/${community.community_id}.md) | ${markdownValue(community.community_name_zh)} | ${markdownValue(community.village_name_zh)} | ${markdownValue(community.established_date)} | ${community.latitude === null ? "缺" : "有"} | ${markdownValue(community.source_record.upload_date)} |`).join("\n");
const overview = `# 臺北市萬華區社區發展協會研究總覽

資料版本：1.0.0

研究日期：${RELEASE_DATE}

## 摘要

本研究依臺北市政府社會局開放資料，以行政區代碼 \`${DISTRICT_CODE}\` 篩選出 **${communities.length} 個萬華區社區發展協會紀錄**。來源資料共含 ${sourceRecords.length} 個臺北市紀錄，公開資源更新時間為 2026-03-31 15:13:03。

本清冊是「資料集收錄範圍」的完整盤點，不等於逐一查核協會目前實際營運狀態。來源沒有營運狀態欄位，因此資料庫一律標示為 \`unknown\`，避免從名冊收錄情形推論營運。

## 核心指標

| 指標 | 數值 | 完整率 |
| --- | ---: | ---: |
| 協會紀錄 | ${communities.length} | 100% |
| 可用座標 | ${withCoordinates} | ${percent(withCoordinates, communities.length)}% |
| 有成立日期 | ${withEstablishmentDate} | ${percent(withEstablishmentDate, communities.length)}% |
| 有立案字號 | ${withRegistration} | ${percent(withRegistration, communities.length)}% |
| 核心欄位完整 | ${completeCore} | ${percent(completeCore, communities.length)}% |
| 地址涵蓋里別 | ${uniqueVillages} | — |

已知成立年份介於 ${Math.min(...establishmentYears)} 至 ${Math.max(...establishmentYears)} 年。這是名冊欄位的描述性結果，不代表協會活動持續時間。

## 協會清冊

| ID | 社區／協會簡稱 | 地址里別 | 成立日期 | 座標 | 來源紀錄日期 |
| --- | --- | --- | --- | --- | --- |
${overviewRows}

## 方法

1. 從[臺北市社區發展服務_社區發展協會](${SOURCE_URL})取得 2026-03-31 版 CSV。
2. 以官方行政區代碼 \`${DISTRICT_CODE}\` 精確篩選萬華區。
3. 將民國日期轉為 ISO 8601 西元日期；空值維持為 null。
4. 保留官方全名、地址、立案字號與座標，不修補或推估缺值。
5. 衍生資料不轉載理事長、電話、傳真與電子郵件，以降低不必要的個人資料再散布。

完整來源選擇與轉換規則見 [政府資料來源登錄](../../research/sources/wanhua-government-open-data.md)，缺值分析見 [資料品質報告](data-quality.md)。

## 資料來源與授權

資料來源：臺北市政府社會局，2026，「臺北市社區發展服務_社區發展協會」。資料依[政府資料開放授權條款第1版](${LICENSE_URL})釋出。
`;

const missingRows = communities.filter((community) => community.missing_fields.length).map((community) => `| ${community.community_id} | ${community.community_name_zh} | ${community.missing_fields.map((field) => `\`${field}\``).join("、")} |`).join("\n");
const quality = `# 萬華區社區發展協會資料品質報告

資料版本：1.0.0

檢查日期：${RELEASE_DATE}

## 結論

31 筆協會紀錄全部具有官方名稱、行政區代碼、郵遞區號、地址、屆期、提供單位與來源紀錄日期。核心研究欄位中，座標缺 ${communities.length - withCoordinates} 筆、成立日期缺 ${communities.length - withEstablishmentDate} 筆、立案字號缺 ${communities.length - withRegistration} 筆。

## 完整性

| 欄位組 | 有值 | 缺值 | 完整率 |
| --- | ---: | ---: | ---: |
| 經緯度（兩者皆有） | ${withCoordinates} | ${communities.length - withCoordinates} | ${percent(withCoordinates, communities.length)}% |
| 成立日期 | ${withEstablishmentDate} | ${communities.length - withEstablishmentDate} | ${percent(withEstablishmentDate, communities.length)}% |
| 立案字號 | ${withRegistration} | ${communities.length - withRegistration} | ${percent(withRegistration, communities.length)}% |
| 三項核心欄位皆完整 | ${completeCore} | ${communities.length - completeCore} | ${percent(completeCore, communities.length)}% |

## 需注意的紀錄

| ID | 協會簡稱 | 缺少欄位 |
| --- | --- | --- |
${missingRows}

## 解讀限制

- 空值表示來源未提供，不代表不存在或為零。
- 地址中的里別是從官方地址文字抽取，僅供分組；不代表協會服務範圍。
- 座標沿用來源，不另行地理編碼；本次僅檢查是否為數值及是否落在合理經緯度範圍。
- 各筆「上傳日期」差異很大，可能反映個別紀錄維護時間，而非組織最新活動日期。
- 名冊沒有活動、獎項、補助或 SDG 對應資料，這些關聯表在本次版本保持空白，不以非政府資料補填。

## 驗證規則

- 記錄數固定為 31；若來源變更，建置流程會停止並要求人工檢查。
- 來源欄位名稱必須與本版完全一致。
- 協會 ID 唯一；行政區代碼必須為 \`${DISTRICT_CODE}\`。
- 經度範圍為 -180 至 180；緯度範圍為 -90 至 90。
- 民國日期必須是七碼 \`YYYMMDD\` 且能轉為有效日期。

資料來源：[臺北市政府社會局開放資料](${SOURCE_URL})。
`;

await fs.writeFile(path.join(reportRoot, "README.md"), overview, "utf8");
await fs.writeFile(path.join(reportRoot, "data-quality.md"), quality, "utf8");

for (const community of communities) {
  const profile = `# ${community.association_name_zh}

## 官方名冊資料

| 欄位 | 值 |
| --- | --- |
| 研究 ID | \`${community.community_id}\` |
| 官方名稱 | ${markdownValue(community.association_name_zh)} |
| 行政區代碼 | \`${community.district_code}\` |
| 地址里別 | ${markdownValue(community.village_name_zh)} |
| 郵遞區號 | ${markdownValue(community.postal_code)} |
| 地址 | ${markdownValue(community.address_zh)} |
| 成立日期 | ${markdownValue(community.established_date)} |
| 立案字號 | ${markdownValue(community.registration_number)} |
| 屆期 | ${markdownValue(community.term_number)} |
| 緯度 | ${markdownValue(community.latitude)} |
| 經度 | ${markdownValue(community.longitude)} |
| 來源紀錄日期 | ${markdownValue(community.source_record.upload_date)} |
| 資料品質 | \`${community.data_quality_flag}\` |

## 研究註記

- 本頁只陳述政府名冊欄位，不推論協會是否持續營運、服務成效或活動範圍。
- ${community.missing_fields.length ? `來源缺少：${community.missing_fields.map((field) => `\`${field}\``).join("、")}。` : "成立日期、立案字號與座標等核心欄位均有值。"}
- 公開來源中的理事長及直接聯絡欄位未轉載；如有核准用途，請查閱原始政府資料。

## 來源

臺北市政府社會局，2026，[「臺北市社區發展服務_社區發展協會」](${SOURCE_URL})，資料資源更新 2026-03-31，存取日 ${RELEASE_DATE}。依[政府資料開放授權條款第1版](${LICENSE_URL})利用。

[返回研究總覽](../README.md)
`;
  await fs.writeFile(path.join(profileRoot, `${community.community_id}.md`), profile, "utf8");
}

console.log(JSON.stringify({
  sourceRecords: sourceRecords.length,
  wanhuaRecords: communities.length,
  withCoordinates,
  withEstablishmentDate,
  withRegistration,
  completeCore,
  uniqueVillages,
  establishmentRange: [Math.min(...establishmentYears), Math.max(...establishmentYears)],
  reports: communities.length + 2,
  databasePath,
}, null, 2));
