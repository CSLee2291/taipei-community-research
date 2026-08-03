"use client";

import { useMemo, useState } from "react";
import { GoogleCommunityMap } from "./GoogleCommunityMap";

export type Community = {
  community_id: string;
  community_name_zh: string;
  association_name_zh: string;
  district_code: string;
  district_name_zh: string;
  village_name_zh: string | null;
  postal_code: string | null;
  address_zh: string | null;
  latitude: number | null;
  longitude: number | null;
  established_date: string | null;
  registration_number: string | null;
  term_number: number | null;
  organization_status: "unknown";
  source_record: {
    upload_date: string | null;
    upload_date_roc: string | null;
    agency_code: string | null;
    providing_unit: string | null;
  };
  provenance: {
    dataset_url: string;
    source_resource_updated_at: string;
    accessed_on: string;
  };
  record_status: string;
  data_quality_flag: "none" | "incomplete";
  missing_fields: string[];
  schema_version: string;
};

export type Database = {
  database_version: string;
  generated_on: string;
  coverage: {
    source_record_count: number;
    record_count: number;
  };
  attribution: {
    dataset_url: string;
    license_url: string;
    attribution_statement: string;
  };
  quality_summary: {
    complete_core_records: number;
    coordinate_records: number;
    unique_address_villages: number;
    earliest_known_establishment_year: number;
    latest_known_establishment_year: number;
    establishment_decade_counts: Record<string, number>;
  };
  communities: Community[];
};

type SortMode = "name" | "established-asc" | "source-updated-desc";

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "未提供" : String(value);
}

export function WanhuaDashboard({ database, googleMapsApiKey = "" }: { database: Database; googleMapsApiKey?: string }) {
  const [query, setQuery] = useState("");
  const [village, setVillage] = useState("all");
  const [quality, setQuality] = useState("all");
  const [sort, setSort] = useState<SortMode>("name");
  const [selectedId, setSelectedId] = useState(database.communities[0]?.community_id ?? "");

  const villages = useMemo(
    () => [...new Set(database.communities.map((community) => community.village_name_zh).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [database.communities],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-Hant");
    const records = database.communities.filter((community) => {
      const matchesQuery = !normalizedQuery || [community.community_id, community.community_name_zh, community.association_name_zh, community.village_name_zh, community.address_zh, community.registration_number].some((value) => value?.toLocaleLowerCase("zh-Hant").includes(normalizedQuery));
      const matchesVillage = village === "all" || community.village_name_zh === village;
      const matchesQuality = quality === "all" || community.data_quality_flag === quality;
      return matchesQuery && matchesVillage && matchesQuality;
    });

    return records.sort((a, b) => {
      if (sort === "established-asc") return (a.established_date ?? "9999").localeCompare(b.established_date ?? "9999");
      if (sort === "source-updated-desc") return (b.source_record.upload_date ?? "0000").localeCompare(a.source_record.upload_date ?? "0000");
      return a.community_name_zh.localeCompare(b.community_name_zh, "zh-Hant");
    });
  }, [database.communities, query, quality, sort, village]);

  const selected = database.communities.find((community) => community.community_id === selectedId) ?? filtered[0] ?? database.communities[0];
  const coordinateRecords = filtered.filter((community): community is Community & { latitude: number; longitude: number } => community.latitude !== null && community.longitude !== null);
  const decadeEntries = Object.entries(database.quality_summary.establishment_decade_counts);
  const maxDecadeCount = Math.max(...decadeEntries.map(([, count]) => count));

  const resetFilters = () => {
    setQuery("");
    setVillage("all");
    setQuality("all");
    setSort("name");
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="brand" aria-label="萬華社區研究儀表板">
          <div className="brand-mark" aria-hidden="true">艋</div>
          <div>
            <strong>萬華社區研究</strong>
            <span>Wanhua civic research index</span>
          </div>
        </div>
        <a className="source-link" href={database.attribution.dataset_url} target="_blank" rel="noreferrer">
          <span>臺北市政府開放資料</span>
          <b aria-hidden="true">↗</b>
        </a>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Government open data · 2026 release</p>
          <h1><em>31</em> 個社區，<br />一份可追溯的萬華視圖</h1>
        </div>
        <div className="hero-copy">
          <p>從臺北市社會局公開名冊出發，整理萬華區社區發展協會的地址、成立時間、立案資料與空間座標。每個數字都保留來源，也保留不知道的部分。</p>
          <div className="hero-note"><strong>資料邊界</strong><span>名冊沒有營運狀態、活動、補助、獎項或 SDG 資料；本儀表板不從缺席的欄位推論結論。</span></div>
        </div>
      </section>

      <main className="main-content">
        <section className="metric-grid" aria-label="研究摘要指標">
          <article className="metric"><span className="metric-label">協會紀錄</span><strong className="metric-value">{database.coverage.record_count}</strong><span className="metric-foot">行政區代碼 63000070</span></article>
          <article className="metric"><span className="metric-label">地址涵蓋里別</span><strong className="metric-value">{database.quality_summary.unique_address_villages}</strong><span className="metric-foot">由官方地址文字抽取</span></article>
          <article className="metric"><span className="metric-label">核心欄位完整率</span><strong className="metric-value">{Math.round((database.quality_summary.complete_core_records / database.coverage.record_count) * 100)}%</strong><span className="metric-foot">日期、立案與座標</span></article>
          <article className="metric"><span className="metric-label">已知成立年份</span><strong className="metric-value">{database.quality_summary.earliest_known_establishment_year}–{String(database.quality_summary.latest_known_establishment_year).slice(2)}</strong><span className="metric-foot">3 筆成立日期未提供</span></article>
        </section>

        <div className="section-heading">
          <h2>空間與時間</h2>
          <p>點位沿用政府資料座標；年代分布只計算有成立日期的 28 筆紀錄。</p>
        </div>

        <section className="analysis-grid" aria-label="空間與年代分析">
          <article className="panel">
            <div className="panel-header"><h3>Google 地圖協會點位</h3><span>{coordinateRecords.length} / {filtered.length} 筆篩選結果可定位</span></div>
            <GoogleCommunityMap apiKey={googleMapsApiKey} communities={coordinateRecords} selectedId={selected?.community_id ?? ""} onSelect={setSelectedId} />
          </article>

          <article className="panel decade-panel">
            <div className="panel-header"><h3>成立年代</h3><span>已知 28 筆</span></div>
            <div className="decade-list">
              {decadeEntries.map(([decade, count]) => <div className="decade-row" key={decade}><strong>{decade}s</strong><div className="decade-track"><div className="decade-bar" style={{ width: `${(count / maxDecadeCount) * 100}%` }} /></div><span>{count}</span></div>)}
            </div>
            <p className="decade-note">成立年份分布顯示 1990 與 2000 年代各有 8 筆，是名冊中最大的兩個群組。這不代表當期政府政策效果，仍需另行研究。</p>
          </article>
        </section>

        <div className="section-heading" id="directory">
          <h2>協會資料目錄</h2>
          <p>搜尋名稱、地址、里別、立案字號或研究 ID；選取紀錄查看完整的非聯絡型公開欄位。</p>
        </div>

        <section aria-labelledby="directory">
          <div className="filter-panel">
            <div className="field"><label htmlFor="search">搜尋</label><input id="search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：艋舺、華江里、COM-0001" /></div>
            <div className="field"><label htmlFor="village">地址里別</label><select id="village" value={village} onChange={(event) => setVillage(event.target.value)}><option value="all">全部里別</option>{villages.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="field"><label htmlFor="quality">資料完整性</label><select id="quality" value={quality} onChange={(event) => setQuality(event.target.value)}><option value="all">全部紀錄</option><option value="none">核心欄位完整</option><option value="incomplete">有缺值</option></select></div>
            <div className="field"><label htmlFor="sort">排序</label><select id="sort" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="name">名稱</option><option value="established-asc">成立日期（早至晚）</option><option value="source-updated-desc">來源紀錄（新至舊）</option></select></div>
            <button className="reset-button" type="button" onClick={resetFilters}>清除</button>
          </div>
          <p className="results-count" aria-live="polite">顯示 {filtered.length} / {database.coverage.record_count} 筆紀錄</p>

          <div className="directory-grid">
            <div className="table-wrap">
              <table className="directory-table">
                <thead><tr><th>協會簡稱</th><th>里別</th><th>成立日期</th><th>立案字號</th><th>資料品質</th></tr></thead>
                <tbody>
                  {filtered.map((community) => <tr key={community.community_id} className={selected?.community_id === community.community_id ? "is-selected" : ""}><td><button type="button" className="name-button" onClick={() => setSelectedId(community.community_id)}>{community.community_name_zh}</button><div className="muted-cell">{community.community_id}</div></td><td>{display(community.village_name_zh)}</td><td>{display(community.established_date)}</td><td>{display(community.registration_number)}</td><td><span className={`status-chip ${community.data_quality_flag}`}>{community.data_quality_flag === "none" ? "完整" : "有缺值"}</span></td></tr>)}
                  {!filtered.length && <tr><td className="empty-row" colSpan={5}>沒有符合條件的紀錄。請調整搜尋或篩選條件。</td></tr>}
                </tbody>
              </table>
            </div>

            {selected && <aside className="detail-panel" aria-label={`${selected.community_name_zh}詳細資料`}>
              <div className="detail-kicker"><span>{selected.community_id}</span><span>SCHEMA {selected.schema_version}</span></div>
              <h3>{selected.community_name_zh}</h3>
              <p className="detail-official-name">{selected.association_name_zh}</p>
              <dl className="detail-list">
                <div className="detail-row"><dt>地址里別</dt><dd>{display(selected.village_name_zh)}</dd></div>
                <div className="detail-row"><dt>地址</dt><dd>{display(selected.address_zh)}</dd></div>
                <div className="detail-row"><dt>成立日期</dt><dd>{display(selected.established_date)}</dd></div>
                <div className="detail-row"><dt>立案字號</dt><dd>{display(selected.registration_number)}</dd></div>
                <div className="detail-row"><dt>屆期</dt><dd>{display(selected.term_number)}</dd></div>
                <div className="detail-row"><dt>座標</dt><dd>{selected.latitude === null ? "未提供" : `${selected.latitude}, ${selected.longitude}`}</dd></div>
                <div className="detail-row"><dt>來源紀錄</dt><dd>{display(selected.source_record.upload_date)}</dd></div>
              </dl>
              <div className="detail-footer">政府名冊未提供營運狀態，本研究不推論。{selected.missing_fields.length ? ` 缺少：${selected.missing_fields.join("、")}。` : " 核心欄位完整。"}<br /><a href={selected.provenance.dataset_url} target="_blank" rel="noreferrer">查看政府原始資料 ↗</a></div>
            </aside>}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div><strong>萬華社區研究</strong>臺北市政府社會局 2026 開放資料衍生研究 · 存取日 {database.generated_on}</div>
        <div className="footer-links"><a href="/data/wanhua-community-associations.json" download>下載 JSON</a><a href={database.attribution.license_url} target="_blank" rel="noreferrer">授權條款</a></div>
      </footer>
    </div>
  );
}
