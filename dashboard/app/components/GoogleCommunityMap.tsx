"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Community } from "./WanhuaDashboard";

type MappableCommunity = Community & { latitude: number; longitude: number };

type Props = {
  apiKey: string;
  communities: MappableCommunity[];
  selectedId: string;
  onSelect: (communityId: string) => void;
};

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-wanhua-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.wanhuaGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&language=zh-TW&region=TW`;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
    document.head.append(script);
  });

  return googleMapsPromise;
}

function googleSearchUrl(community: MappableCommunity) {
  const query = encodeURIComponent(`${community.latitude},${community.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&utm_source=wanhua-community-research&utm_campaign=place-details`;
}

function googleDirectionsUrl(community: MappableCommunity) {
  const destination = encodeURIComponent(`${community.latitude},${community.longitude}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit&utm_source=wanhua-community-research&utm_campaign=directions`;
}

function googleEmbedUrl(community: MappableCommunity) {
  const query = encodeURIComponent(`${community.latitude},${community.longitude}`);
  return `https://maps.google.com/maps?q=${query}&z=16&hl=zh-TW&output=embed`;
}

export function GoogleCommunityMap({ apiKey, communities, selectedId, onSelect }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const selected = useMemo(
    () => communities.find((community) => community.community_id === selectedId) ?? communities[0],
    [communities, selectedId],
  );
  const useInteractiveMap = Boolean(apiKey) && !loadFailed;

  useEffect(() => {
    if (!apiKey || !mapElement.current) return;
    let disposed = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (disposed || !mapElement.current) return;
        map.current = new google.maps.Map(mapElement.current, {
          center: { lat: 25.036, lng: 121.499 },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        setMapReady(true);
      })
      .catch(() => {
        if (!disposed) setLoadFailed(true);
      });

    return () => {
      disposed = true;
      markers.current.forEach((marker) => marker.setMap(null));
      markers.current = [];
      map.current = null;
      setMapReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!map.current || !window.google?.maps) return;
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = [];
    if (!communities.length) return;

    const bounds = new google.maps.LatLngBounds();
    markers.current = communities.map((community) => {
      const isSelected = community.community_id === selected?.community_id;
      const position = { lat: community.latitude, lng: community.longitude };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map: map.current,
        position,
        title: `${community.community_name_zh} · ${community.village_name_zh ?? "里別未提供"}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? "#b64e3b" : "#145c4f",
          fillOpacity: 1,
          strokeColor: "#fffaf0",
          strokeWeight: 3,
          scale: isSelected ? 10 : 7,
        },
      });
      marker.addListener("click", () => onSelect(community.community_id));
      return marker;
    });

    if (communities.length === 1) {
      map.current.setCenter(bounds.getCenter());
      map.current.setZoom(16);
    } else {
      map.current.fitBounds(bounds, 54);
    }
  }, [communities, mapReady, onSelect, selected?.community_id]);

  if (!communities.length) {
    return <div className="google-map-empty">目前篩選結果沒有可用座標</div>;
  }

  return (
    <div className="google-map-block">
      <div className="google-map-shell">
        {useInteractiveMap ? (
          <div ref={mapElement} className="google-map-canvas" role="application" aria-label="Google 地圖：萬華區社區發展協會位置" />
        ) : selected ? (
          <iframe
            className="google-map-frame"
            src={googleEmbedUrl(selected)}
            title={`Google 地圖：${selected.community_name_zh}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}

        {selected && (
          <div className="map-info-card">
            <span className="map-provider">Google Maps</span>
            <strong>{selected.community_name_zh}</strong>
            <small>{selected.address_zh ?? `${selected.latitude}, ${selected.longitude}`}</small>
            <div className="map-actions">
              <a href={googleSearchUrl(selected)} target="_blank" rel="noreferrer">在地圖開啟 ↗</a>
              <a href={googleDirectionsUrl(selected)} target="_blank" rel="noreferrer">大眾運輸路線 ↗</a>
            </div>
          </div>
        )}
      </div>

      <div className="map-location-strip" aria-label="可定位協會清單">
        {communities.map((community) => (
          <button
            key={community.community_id}
            type="button"
            className={community.community_id === selected?.community_id ? "is-selected" : ""}
            onClick={() => onSelect(community.community_id)}
          >
            <span>{community.community_name_zh}</span>
            <small>{community.village_name_zh ?? "里別未提供"}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
