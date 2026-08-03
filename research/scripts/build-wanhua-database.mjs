import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const citySourcePath = path.join(root, "data/external/taipei-city/2026-03-31/community-development-associations.csv");
const districtRosterPath = path.join(root, "research/sources/wanhua-district-office-roster-2026-02-12.csv");
const databasePath = path.join(root, "data/processed/wanhua-community-associations.json");
const communityProfileCsvPath = path.join(root, "data/csv/CommunityProfile.csv");
const communityProfileJsonPath = path.join(root, "data/json/CommunityProfile.json");
const dashboardDataPath = path.join(root, "dashboard/app/data/wanhua-community-associations.json");
const dashboardDownloadPath = path.join(root, "dashboard/public/data/wanhua-community-associations.json");
const idMapPath = path.join(root, "research/mappings/wanhua-community-ids.json");
const reportRoot = path.join(root, "report/wanhua");
const profileRoot = path.join(reportRoot, "associations");
const communityListPath = path.join(root, "docs/community-list.md");

const CITY_SOURCE_URL = "https://data.taipei/dataset/detail?id=e81a07f7-8137-4019-a96f-210a00ef72a3";
const DISTRICT_SOURCE_URL = "https://whdo.gov.taipei/News_Content.aspx?n=C0AA7DA1A318888E&s=E6F2F710D4BA58ED&sms=9CDDA66829FF2249";
const DISTRICT_LIST_URL = "https://whdo.gov.taipei/News.aspx?n=C0AA7DA1A318888E&sms=9CDDA66829FF2249";
const LICENSE_URL = "https://data.taipei/rule";
const DISTRICT_CODE = "63000070";
const DISTRICT_ROSTER_DATE = "2026-02-12";
const DISTRICT_RESOURCE_UPDATED_AT = "2026-02-12T09:00:47+08:00";
const CITY_RESOURCE_UPDATED_AT = "2026-03-31T15:13:03+08:00";
const RELEASE_DATE = "2026-08-03";
const RELEASE_TIMESTAMP = "2026-08-03T10:00:00Z";
const DATABASE_VERSION = "1.1.0";
const PROFILE_SCHEMA_VERSION = "1.0.0";

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
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (field || row.length) rows.push([...row, field.replace(/\r$/, "")]);
  return rows;
}

function recordsFromCsv(text, expectedHeaders, label) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const headers = rows.shift();
  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`${label} headers changed; review the transformation before rebuilding.`);
  }
  return rows.filter((row) => row.some((value) => value !== "")).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function rocDateToIso(value) {
  if (!value) return null;
  if (!/^\d{7}$/.test(value)) throw new Error(`Unexpected ROC date: ${value}`);
  const iso = `${Number(value.slice(0, 3)) + 1911}-${value.slice(3, 5)}-${value.slice(5, 7)}`;
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

function canonicalAddress(value) {
  return String(value ?? "")
    .replace(/^臺北市萬華區/, "")
    .replace(/^[^路街巷弄號]{1,12}里/, "")
    .replaceAll("一", "1")
    .replaceAll("二", "2")
    .replaceAll("三", "3")
    .replaceAll("-", "之")
    .replaceAll("號之一", "號之1")
    .replace(/\s/g, "");
}

function markdownValue(value, fallback = "未提供") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replaceAll("|", "\\|");
}

function percent(part, whole) {
  return Math.round((part / whole) * 1000) / 10;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const [citySourceText, districtRosterText, idMapText] = await Promise.all([
  fs.readFile(citySourcePath, "utf8"),
  fs.readFile(districtRosterPath, "utf8"),
  fs.readFile(idMapPath, "utf8"),
]);
const idMap = JSON.parse(idMapText);

const cityHeaders = ["機構名稱", "行政區代碼", "理事長", "屆期", "郵遞區號", "地址", "電話", "傳真", "電子郵件", "立案字號", "成立日期", "經度", "緯度", "機關代碼", "提供單位", "上傳日期"];
const rosterHeaders = ["roster_number", "village_name_zh", "association_name_zh", "term_number", "address_zh"];
const cityRecords = recordsFromCsv(citySourceText, cityHeaders, "Taipei City source CSV");
const cityWanhuaRows = cityRecords.filter((record) => record["行政區代碼"] === DISTRICT_CODE);
const districtRosterRows = recordsFromCsv(districtRosterText, rosterHeaders, "Wanhua District Office roster CSV");

if (cityWanhuaRows.length !== 31) {
  throw new Error(`Expected 31 Wanhua rows in the 2026-03-31 citywide snapshot, found ${cityWanhuaRows.length}.`);
}
if (districtRosterRows.length !== 33) {
  throw new Error(`Expected 33 rows in the 2026-02-12 district roster, found ${districtRosterRows.length}.`);
}
const rosterNumbers = districtRosterRows.map((row) => Number(row.roster_number));
if (JSON.stringify(rosterNumbers) !== JSON.stringify(Array.from({ length: 33 }, (_, index) => index + 1))) {
  throw new Error("District roster numbers must be unique and consecutive from 1 through 33.");
}

const cityByName = new Map(cityWanhuaRows.map((row) => [row["機構名稱"].trim(), row]));
const rosterNames = new Set(districtRosterRows.map((row) => `臺北市萬華區${row.association_name_zh.trim()}`));
const cityOnlyNames = [...cityByName.keys()].filter((name) => !rosterNames.has(name));
const unmappedNames = [...rosterNames].filter((name) => !idMap[name]);
const duplicateIds = Object.values(idMap).filter((id, index, ids) => ids.indexOf(id) !== index);
if (cityOnlyNames.length || unmappedNames.length || duplicateIds.length) {
  throw new Error(`Community mapping requires review. City-only: ${cityOnlyNames.join(", ") || "none"}; unmapped: ${unmappedNames.join(", ") || "none"}; duplicate IDs: ${duplicateIds.join(", ") || "none"}.`);
}

const communities = districtRosterRows.map((rosterRow) => {
  const fullName = `臺北市萬華區${rosterRow.association_name_zh.trim()}`;
  const cityRow = cityByName.get(fullName) ?? null;
  const village = rosterRow.village_name_zh.trim();
  const currentAddress = `臺北市萬華區${village}${rosterRow.address_zh.trim()}`;
  const cityAddress = cityRow ? nullable(cityRow["地址"]) : null;
  const addressMatchesCitySource = cityAddress !== null && canonicalAddress(cityAddress) === canonicalAddress(currentAddress);
  const establishedDate = cityRow ? rocDateToIso(cityRow["成立日期"]) : null;
  const registrationNumber = cityRow ? nullable(cityRow["立案字號"]) : null;
  const longitude = addressMatchesCitySource ? nullableNumber(cityRow["經度"]) : null;
  const latitude = addressMatchesCitySource ? nullableNumber(cityRow["緯度"]) : null;
  const missingFields = [
    !establishedDate ? "established_date" : null,
    !registrationNumber ? "registration_number" : null,
    longitude === null || latitude === null ? "coordinates" : null,
  ].filter(Boolean);

  return {
    community_id: idMap[fullName],
    district_roster_number: Number(rosterRow.roster_number),
    community_name_zh: fullName.replace(/^臺北市萬華區/, "").replace(/社區發展協會$/, ""),
    association_name_zh: fullName,
    district_code: DISTRICT_CODE,
    district_name_zh: "萬華區",
    village_name_zh: village,
    postal_code: cityRow ? nullable(cityRow["郵遞區號"]) : null,
    address_zh: currentAddress,
    latitude,
    longitude,
    established_date: establishedDate,
    registration_number: registrationNumber,
    term_number: nullableNumber(rosterRow.term_number),
    organization_status: "unknown",
    source_record: {
      upload_date: cityRow ? rocDateToIso(cityRow["上傳日期"]) : DISTRICT_ROSTER_DATE,
      upload_date_roc: cityRow ? nullable(cityRow["上傳日期"]) : null,
      agency_code: cityRow ? nullable(cityRow["機關代碼"]) : null,
      providing_unit: cityRow ? nullable(cityRow["提供單位"]) : "臺北市萬華區公所",
      district_roster_number: Number(rosterRow.roster_number),
      district_roster_published_on: DISTRICT_ROSTER_DATE,
    },
    provenance: {
      dataset_title: "臺北市萬華區社區發展協會組織區域一覽表",
      dataset_url: DISTRICT_SOURCE_URL,
      source_resource_updated_at: DISTRICT_RESOURCE_UPDATED_AT,
      accessed_on: RELEASE_DATE,
      city_dataset_title: cityRow ? "臺北市社區發展服務_社區發展協會" : null,
      city_dataset_url: cityRow ? CITY_SOURCE_URL : null,
      city_dataset_id: cityRow ? "e81a07f7-8137-4019-a96f-210a00ef72a3" : null,
      city_resource_id: cityRow ? "654f0abf-b859-4a1d-8dcd-28c733313c1c" : null,
      city_source_resource_updated_at: cityRow ? CITY_RESOURCE_UPDATED_AT : null,
    },
    source_comparison: {
      present_in_citywide_dataset: cityRow !== null,
      citywide_address_zh: cityAddress,
      address_matches_city_source: addressMatchesCitySource,
      coordinates_withheld_for_address_change: cityRow !== null && !addressMatchesCitySource &&
        (nullableNumber(cityRow["經度"]) !== null || nullableNumber(cityRow["緯度"]) !== null),
    },
    record_status: "verified",
    data_quality_flag: missingFields.length ? "incomplete" : "none",
    missing_fields: missingFields,
    schema_version: PROFILE_SCHEMA_VERSION,
  };
}).sort((a, b) => a.community_id.localeCompare(b.community_id));

const withCoordinates = communities.filter((community) => community.latitude !== null && community.longitude !== null).length;
const withEstablishmentDate = communities.filter((community) => community.established_date !== null).length;
const withRegistration = communities.filter((community) => community.registration_number !== null).length;
const completeCore = communities.filter((community) => community.missing_fields.length === 0).length;
const uniqueVillages = new Set(communities.map((community) => community.village_name_zh)).size;
const cityCrosschecked = communities.filter((community) => community.source_comparison.present_in_citywide_dataset).length;
const addressChanges = communities.filter((community) => !community.source_comparison.address_matches_city_source).length;
const coordinatesWithheld = communities.filter((community) => community.source_comparison.coordinates_withheld_for_address_change).length;
const establishmentYears = communities.map((community) => community.established_date?.slice(0, 4)).filter(Boolean).map(Number);
const decades = [...new Set(establishmentYears.map((year) => Math.floor(year / 10) * 10))].sort();
const decadeCounts = Object.fromEntries(decades.map((decade) => [
  String(decade),
  establishmentYears.filter((year) => Math.floor(year / 10) * 10 === decade).length,
]));

const database = {
  database_version: DATABASE_VERSION,
  generated_on: RELEASE_DATE,
  title: "Taipei Wanhua Community Development Associations",
  title_zh: "臺北市萬華區社區發展協會主資料庫",
  coverage: {
    rule: `included in the Wanhua District Office roster published on ${DISTRICT_ROSTER_DATE}`,
    district_code: DISTRICT_CODE,
    district_name_zh: "萬華區",
    source_record_count: cityRecords.length,
    citywide_wanhua_record_count: cityWanhuaRows.length,
    district_roster_record_count: districtRosterRows.length,
    record_count: communities.length,
  },
  attribution: {
    primary_provider: "臺北市萬華區公所",
    primary_dataset_title: "臺北市萬華區社區發展協會組織區域一覽表",
    primary_dataset_url: DISTRICT_SOURCE_URL,
    secondary_provider: "臺北市政府社會局",
    secondary_dataset_title: "臺北市社區發展服務_社區發展協會",
    secondary_dataset_url: CITY_SOURCE_URL,
    license: "政府資料開放授權條款-第1版",
    license_url: LICENSE_URL,
    attribution_statement: "臺北市萬華區公所 2026，臺北市萬華區社區發展協會組織區域一覽表；臺北市政府社會局 2026，臺北市社區發展服務_社區發展協會。",
  },
  privacy: {
    public_contact_fields_redistributed: false,
    note: "官方來源中的理事長姓名、電話、傳真與電子郵件不轉載至公開衍生資料。",
  },
  quality_summary: {
    complete_core_records: completeCore,
    coordinate_records: withCoordinates,
    establishment_date_records: withEstablishmentDate,
    registration_number_records: withRegistration,
    unique_address_villages: uniqueVillages,
    citywide_crosschecked_records: cityCrosschecked,
    district_only_records: communities.length - cityCrosschecked,
    address_changes_or_district_only_records: addressChanges,
    coordinates_withheld_for_address_change: coordinatesWithheld,
    earliest_known_establishment_year: Math.min(...establishmentYears),
    latest_known_establishment_year: Math.max(...establishmentYears),
    establishment_decade_counts: decadeCounts,
  },
  communities,
};

const profileFields = [
  "profile_id", "community_id", "community_name_zh", "association_name_zh", "district_code",
  "district_name_zh", "village_name_zh", "postal_code", "address_zh", "latitude", "longitude",
  "established_date", "registration_number", "term_number", "organization_status",
  "source_dataset_title", "source_url", "source_resource_updated_at", "source_accessed_on",
  "record_status", "data_quality_flag", "is_example", "created_at", "updated_at", "schema_version", "notes",
];
const profiles = communities.map((community) => {
  const notes = [
    `區公所名冊編號 ${community.district_roster_number}；名冊用於確認協會存在、社區範圍、屆期與現址。`,
    community.source_comparison.present_in_citywide_dataset
      ? "成立日期、立案字號與可用座標來自臺北市政府社會局全市資料集。"
      : "未出現在 2026-03-31 全市 CSV；成立日期、立案字號與座標列為 TODO。",
    community.source_comparison.coordinates_withheld_for_address_change
      ? "兩個官方來源的地址不同，未沿用舊址座標，待重新定位。"
      : null,
    "官方來源未提供營運狀態，因此 organization_status 為 unknown。",
  ].filter(Boolean).join(" ");
  return {
    profile_id: `PROFILE-${community.community_id}`,
    community_id: community.community_id,
    community_name_zh: community.community_name_zh,
    association_name_zh: community.association_name_zh,
    district_code: community.district_code,
    district_name_zh: community.district_name_zh,
    village_name_zh: community.village_name_zh,
    postal_code: community.postal_code,
    address_zh: community.address_zh,
    latitude: community.latitude,
    longitude: community.longitude,
    established_date: community.established_date,
    registration_number: community.registration_number,
    term_number: community.term_number,
    organization_status: community.organization_status,
    source_dataset_title: community.source_comparison.present_in_citywide_dataset
      ? "臺北市萬華區社區發展協會組織區域一覽表；臺北市社區發展服務_社區發展協會"
      : "臺北市萬華區社區發展協會組織區域一覽表",
    source_url: DISTRICT_SOURCE_URL,
    source_resource_updated_at: DISTRICT_RESOURCE_UPDATED_AT,
    source_accessed_on: RELEASE_DATE,
    record_status: community.record_status,
    data_quality_flag: community.data_quality_flag,
    is_example: false,
    created_at: RELEASE_TIMESTAMP,
    updated_at: RELEASE_TIMESTAMP,
    schema_version: PROFILE_SCHEMA_VERSION,
    notes,
  };
});
const profileCsv = [
  profileFields.join(","),
  ...profiles.map((profile) => profileFields.map((field) => csvValue(profile[field])).join(",")),
].join("\n") + "\n";
const profilePublication = {
  dataset: "CommunityProfile",
  schema_version: PROFILE_SCHEMA_VERSION,
  generated_at: RELEASE_TIMESTAMP,
  record_count: profiles.length,
  records: profiles,
};

await Promise.all([
  fs.mkdir(path.dirname(databasePath), { recursive: true }),
  fs.mkdir(profileRoot, { recursive: true }),
  fs.mkdir(path.dirname(dashboardDataPath), { recursive: true }),
  fs.mkdir(path.dirname(dashboardDownloadPath), { recursive: true }),
]);
await Promise.all([
  fs.writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8"),
  fs.writeFile(communityProfileCsvPath, profileCsv, "utf8"),
  fs.writeFile(communityProfileJsonPath, `${JSON.stringify(profilePublication, null, 2)}\n`, "utf8"),
]);
await Promise.all([
  fs.copyFile(databasePath, dashboardDataPath),
  fs.copyFile(databasePath, dashboardDownloadPath),
]);

const rosterOrder = [...communities].sort((a, b) => a.district_roster_number - b.district_roster_number);
const overviewRows = rosterOrder.map((community) =>
  `| ${community.district_roster_number} | [${community.community_id}](associations/${community.community_id}.md) | ${markdownValue(community.community_name_zh)} | ${markdownValue(community.village_name_zh)} | ${markdownValue(community.established_date)} | ${community.latitude === null ? "缺" : "有"} | ${community.source_comparison.present_in_citywide_dataset ? "雙來源" : "僅區公所"} |`,
).join("\n");
const overview = `# 臺北市萬華區社區發展協會研究總覽

資料版本：${DATABASE_VERSION}

研究日期：${RELEASE_DATE}

## 摘要

本研究以臺北市萬華區公所 ${DISTRICT_ROSTER_DATE} 公布的一覽表為母體，共確認 **${communities.length} 個社區發展協會**。其中 ${cityCrosschecked} 筆也出現在臺北市政府社會局 2026-03-31 全市 CSV，另有 ${communities.length - cityCrosschecked} 筆只出現在較新的區公所名冊。

名冊收錄不等於已證明目前持續營運。官方來源沒有可直接判定營運狀態的欄位，因此一律標示 unknown。

## 核心指標

| 指標 | 數值 | 完整率 |
| --- | ---: | ---: |
| 區公所名冊紀錄 | ${communities.length} | 100% |
| 可用且與現址一致的座標 | ${withCoordinates} | ${percent(withCoordinates, communities.length)}% |
| 有成立日期 | ${withEstablishmentDate} | ${percent(withEstablishmentDate, communities.length)}% |
| 有立案字號 | ${withRegistration} | ${percent(withRegistration, communities.length)}% |
| 三項核心欄位完整 | ${completeCore} | ${percent(completeCore, communities.length)}% |
| 地址涵蓋里別 | ${uniqueVillages} | — |

## 協會清冊

| 官方編號 | ID | 協會簡稱 | 社區範圍 | 成立日期 | 座標 | 來源涵蓋 |
| ---: | --- | --- | --- | --- | --- | --- |
${overviewRows}

## 方法

1. 以[萬華區公所一覽表](${DISTRICT_SOURCE_URL})的編號 1–33 定義 Sprint 1 母體。
2. 用[臺北市政府社會局全市資料](${CITY_SOURCE_URL})交叉比對 31 筆名稱，補充成立日期、立案字號與座標。
3. 現址採區公所 2026-02-12 名冊；兩來源地址不同時，不將舊址座標套用至新址。
4. 空值維持為 null，不推估成立日、立案字號、座標或營運狀態。
5. 公開衍生資料不轉載理事長、電話、傳真與電子郵件。

完整清冊與 TODO 見 [Sprint 1 社區名冊](../../docs/community-list.md)，來源規則見[政府資料來源登錄](../../research/sources/wanhua-government-open-data.md)。
`;

const missingRows = communities.filter((community) => community.missing_fields.length).map((community) =>
  `| ${community.community_id} | ${community.community_name_zh} | ${community.missing_fields.map((field) => `\`${field}\``).join("、")} |`,
).join("\n");
const quality = `# 萬華區社區發展協會資料品質報告

資料版本：${DATABASE_VERSION}

檢查日期：${RELEASE_DATE}

## 結論

區公所最新名冊共有 ${communities.length} 筆；其中 ${cityCrosschecked} 筆可由社會局全市 CSV 交叉比對，${communities.length - cityCrosschecked} 筆僅出現在區公所名冊。座標缺 ${communities.length - withCoordinates} 筆、成立日期缺 ${communities.length - withEstablishmentDate} 筆、立案字號缺 ${communities.length - withRegistration} 筆。

## 完整性

| 欄位組 | 有值 | 缺值 | 完整率 |
| --- | ---: | ---: | ---: |
| 經緯度（兩者皆有且地址一致） | ${withCoordinates} | ${communities.length - withCoordinates} | ${percent(withCoordinates, communities.length)}% |
| 成立日期 | ${withEstablishmentDate} | ${communities.length - withEstablishmentDate} | ${percent(withEstablishmentDate, communities.length)}% |
| 立案字號 | ${withRegistration} | ${communities.length - withRegistration} | ${percent(withRegistration, communities.length)}% |
| 三項核心欄位皆完整 | ${completeCore} | ${communities.length - completeCore} | ${percent(completeCore, communities.length)}% |

## 需注意的紀錄

| ID | 協會簡稱 | 缺少欄位 |
| --- | --- | --- |
${missingRows}

## 解讀限制

- 空值表示官方來源未提供或來源間地址不能安全對應，不代表不存在或為零。
- 區公所名冊的「社區範圍」用於 village 欄位，不推論實際服務範圍。
- ${coordinatesWithheld} 筆紀錄因區公所現址與社會局座標來源地址不同，未沿用舊座標。
- 名冊沒有活動、獎項、補助、會員、志工或 SDG 成效資料；本 Sprint 不研究這些項目。

## 驗證規則

- 區公所名冊編號必須連續為 1–33；筆數或名稱變更時停止建置並要求人工檢查。
- 社會局 2026-03-31 快照必須維持 31 筆萬華資料，且全部能對應區公所名冊。
- 協會 ID 唯一；行政區代碼為 ${DISTRICT_CODE}。
- CSV、JSON、處理後資料與 Markdown 的 Profile 母體必須同為 33 筆。

資料來源：[萬華區公所官方名冊](${DISTRICT_SOURCE_URL})、[臺北市政府社會局開放資料](${CITY_SOURCE_URL})。
`;

const communityListRows = rosterOrder.map((community) =>
  `| ${community.district_roster_number} | ${community.community_id} | ${community.association_name_zh} | ${community.village_name_zh} | ${community.address_zh} | ${markdownValue(community.established_date)} | ${markdownValue(community.registration_number)} | ${community.source_comparison.present_in_citywide_dataset ? "區公所＋社會局" : "僅區公所"} |`,
).join("\n");
const todoRows = communities.filter((community) => community.missing_fields.length).map((community) =>
  `- [ ] ${community.community_id} ${community.association_name_zh}：查證 ${community.missing_fields.join("、")}。`,
).join("\n");
const communityList = `# 萬華區社區發展協會名冊

資料截止日：${RELEASE_DATE}

## 查證結論

臺北市萬華區公所於 2026-02-12 公布的官方一覽表共有 **33 筆**。社會局 2026-03-31 全市 CSV 可交叉比對其中 **31 筆**；「愛在孝德社區發展協會」與「西門社區發展協會」只出現在區公所名冊，因此成立日期、立案字號與座標保持空值。

| 官方編號 | 研究 ID | 協會名稱 | 社區範圍 | 區公所現址 | 成立日期 | 立案字號 | 來源涵蓋 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${communityListRows}

## TODO：尚未能由目前官方來源驗證

${todoRows}

以下欄位未在本 Sprint 取得涵蓋 33 個協會、定義一致且可重製的官方資料，因此不填入主資料庫：

- [ ] 逐一確認可公開再利用的協會組織聯絡管道。
- [ ] 查證會員數與統計日期。
- [ ] 查證志工數與統計定義。
- [ ] 查證社區照顧關懷據點及其有效期間。
- [ ] 查證政府評鑑、年度與評鑑結果。
- [ ] 對兩來源地址不一致的紀錄重新取得或地理編碼現址座標。

## 來源

1. 臺北市萬華區公所，[萬華區社區發展協會一覽表](${DISTRICT_SOURCE_URL})，上版日期 2026-02-12，存取日 ${RELEASE_DATE}。
2. 臺北市政府社會局，[臺北市社區發展服務_社區發展協會](${CITY_SOURCE_URL})，CSV 資源更新 2026-03-31 15:13:03，存取日 ${RELEASE_DATE}。

名冊只證明政府來源的收錄情形，不代表本研究已確認協會目前持續營運，也不代表沒有列出的活動、會員、志工、據點或評鑑不存在。
`;

await Promise.all([
  fs.writeFile(path.join(reportRoot, "README.md"), overview, "utf8"),
  fs.writeFile(path.join(reportRoot, "data-quality.md"), quality, "utf8"),
  fs.writeFile(communityListPath, communityList, "utf8"),
]);

for (const community of communities) {
  const profile = `# ${community.association_name_zh}

## 官方名冊資料

| 欄位 | 值 |
| --- | --- |
| 研究 ID | \`${community.community_id}\` |
| 區公所名冊編號 | ${community.district_roster_number} |
| 官方名稱 | ${markdownValue(community.association_name_zh)} |
| 行政區代碼 | \`${community.district_code}\` |
| 社區範圍 | ${markdownValue(community.village_name_zh)} |
| 郵遞區號 | ${markdownValue(community.postal_code)} |
| 區公所現址 | ${markdownValue(community.address_zh)} |
| 成立日期 | ${markdownValue(community.established_date)} |
| 立案字號 | ${markdownValue(community.registration_number)} |
| 屆期 | ${markdownValue(community.term_number)} |
| 緯度 | ${markdownValue(community.latitude)} |
| 經度 | ${markdownValue(community.longitude)} |
| 來源涵蓋 | ${community.source_comparison.present_in_citywide_dataset ? "區公所＋社會局" : "僅區公所"} |
| 資料品質 | \`${community.data_quality_flag}\` |

## 研究註記

- 本頁只陳述政府名冊欄位，不推論協會是否持續營運、服務成效或活動範圍。
- ${community.missing_fields.length ? `目前缺少：${community.missing_fields.map((field) => `\`${field}\``).join("、")}。` : "成立日期、立案字號與現址座標等核心欄位均有值。"}
- ${community.source_comparison.coordinates_withheld_for_address_change ? "兩個官方來源地址不同，未把舊址座標套用至區公所現址。" : "座標只在社會局地址與區公所現址相符時保留。"}
- 公開來源中的理事長及直接聯絡欄位未轉載。

## 來源

臺北市萬華區公所，[「萬華區社區發展協會一覽表」](${DISTRICT_SOURCE_URL})，上版日期 ${DISTRICT_ROSTER_DATE}；臺北市政府社會局，[「臺北市社區發展服務_社區發展協會」](${CITY_SOURCE_URL})，資源更新 2026-03-31。存取日 ${RELEASE_DATE}。

[返回研究總覽](../README.md)
`;
  await fs.writeFile(path.join(profileRoot, `${community.community_id}.md`), profile, "utf8");
}

console.log(JSON.stringify({
  citywideSourceRecords: cityRecords.length,
  citywideWanhuaRecords: cityWanhuaRows.length,
  districtRosterRecords: districtRosterRows.length,
  masterRecords: communities.length,
  districtOnlyRecords: communities.length - cityCrosschecked,
  withCoordinates,
  withEstablishmentDate,
  withRegistration,
  completeCore,
  addressChanges,
  coordinatesWithheld,
  reports: communities.length + 2,
  communityProfileCsvPath,
  communityProfileJsonPath,
  communityListPath,
  databasePath,
}, null, 2));
