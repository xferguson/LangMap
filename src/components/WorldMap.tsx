import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, AttributionControl } from "react-leaflet";
import type { Layer, Path, GeoJSON as LeafletGeoJSON, PathOptions } from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import countriesGeo from "../data/countries.geo.json";
import admin1Geo from "../data/admin1.geo.json";
import type { AppState, RegionRef } from "../types";
import { coverageMap } from "../lib/coverage";

const COUNTRIES = countriesGeo as unknown as FeatureCollection;
const ADMIN1 = admin1Geo as unknown as FeatureCollection;

const FILL_COLOR = "#3b82f6";
const STROKE_COLOR = "#9ca3af";
const STROKE_WEIGHT = 0.4;

function isoOf(feature: Feature | undefined): RegionRef | null {
  if (!feature) return null;
  const iso = (feature.properties as Record<string, unknown> | null)?.iso;
  return typeof iso === "string" ? iso : null;
}

function styleFor(op: number): PathOptions {
  return {
    fillColor: FILL_COLOR,
    fillOpacity: op,
    weight: STROKE_WEIGHT,
    color: STROKE_COLOR,
  };
}

interface Props {
  state: AppState;
}

export function WorldMap({ state }: Props) {
  const cov = useMemo(() => coverageMap(state), [state]);
  const countriesRef = useRef<LeafletGeoJSON | null>(null);
  const admin1Ref = useRef<LeafletGeoJSON | null>(null);

  const styleFeature = (feature: Feature | undefined): PathOptions => {
    const code = isoOf(feature);
    const op = code ? cov.get(code) : undefined;
    return styleFor(op ?? 0);
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const code = isoOf(feature);
    if (code === null) return;
    const setRegionAttr = () => {
      const el = (layer as Path).getElement?.();
      if (el) el.setAttribute("data-region", code);
    };
    layer.on("add", setRegionAttr);
    setRegionAttr();
  };

  useEffect(() => {
    const apply = (group: LeafletGeoJSON | null) => {
      if (!group) return;
      group.eachLayer((layer: Layer) => {
        const feature = (layer as Layer & { feature?: Feature }).feature;
        const code = isoOf(feature);
        if (code === null) return;
        const op = cov.get(code);
        (layer as Path).setStyle(styleFor(op ?? 0));
        const el = (layer as Path).getElement?.();
        if (el) el.setAttribute("data-region", code);
      });
    };
    apply(countriesRef.current);
    apply(admin1Ref.current);
  });

  const countriesLayer = useMemo(
    () => (
      <GeoJSON
        data={COUNTRIES}
        style={(feature) => styleFeature(feature) as PathOptions}
        onEachFeature={onEachFeature}
        ref={countriesRef}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const admin1Layer = useMemo(
    () => (
      <GeoJSON
        data={ADMIN1}
        style={(feature) => styleFeature(feature) as PathOptions}
        onEachFeature={onEachFeature}
        ref={admin1Ref}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div data-testid="world-map" className="world-map-root" style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={6}
        scrollWheelZoom
        attributionControl={false}
        style={{ height: "100vh", width: "100%" }}
      >
        <AttributionControl prefix={false} position="bottomright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />
        {countriesLayer}
        {admin1Layer}
      </MapContainer>
      <div
        data-testid="map-coverage-state"
        data-coverage={JSON.stringify([...cov])}
        style={{ display: "none" }}
      />
    </div>
  );
}
