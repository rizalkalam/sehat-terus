/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";

// Leaflet default marker icon fixes (not strictly needed for GeoJSON polygons, but good practice)
import "leaflet/dist/leaflet.css";

interface SpatialCase {
  kecamatan_domisili: string;
  total_cases: number;
  population: number;
}

interface MapComponentProps {
  spatialData: SpatialCase[];
  selectedKecamatanName: string | null;
  onSelectKecamatan: (name: string) => void;
}

export default function MapComponent({
  spatialData,
  selectedKecamatanName,
  onSelectKecamatan
}: MapComponentProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  // Load the local Sleman GeoJSON boundaries on mount
  useEffect(() => {
    fetch("/geojson/sleman-kecamatan.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch Sleman GeoJSON");
        }
        return res.json();
      })
      .then((data) => {
        // Filter features to keep only Sleman sub-districts (province code starting with 34.04 or matching Sleman list)
        // Sleman sub-districts list:
        const slemanKecamatans = [
          'Turi', 'Pakem', 'Cangkringan', 'Tempel', 'Sleman', 'Ngaglik',
          'Ngemplak', 'Minggir', 'Seyegan', 'Mlati', 'Moyudan', 'Godean',
          'Gamping', 'Depok', 'Kalasan', 'Berbah', 'Prambanan'
        ];
        const slemanFeatures = data.features.filter((f: any) =>
          f.properties && slemanKecamatans.includes(f.properties.name)
        );
        setGeoJsonData({
          type: "FeatureCollection",
          features: slemanFeatures
        });
      })
      .catch((err) => console.error("Error loading Sleman GeoJSON:", err));
  }, []);

  const getColor = (cases: number) => {
    if (cases > 150) return "#f43f5e"; // Tinggi / Rose (Siaga)
    if (cases >= 50) return "#fbbf24";  // Sedang / Amber
    return "#34d399";                  // Rendah / Emerald (Aman)
  };

  const styleFeature = (feature: any) => {
    const name = feature.properties?.name || "";
    const casesData = spatialData.find(
      (item) => item.kecamatan_domisili.toLowerCase() === name.toLowerCase()
    );
    const cases = casesData ? casesData.total_cases : 0;
    const isSelected = selectedKecamatanName && selectedKecamatanName.toLowerCase() === name.toLowerCase();

    return {
      fillColor: getColor(cases),
      weight: isSelected ? 3.5 : 1.5,
      opacity: 1,
      color: isSelected ? "#0c818a" : "#ffffff",
      fillOpacity: isSelected ? 0.75 : 0.45,
      dashArray: isSelected ? "3" : ""
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties?.name || "";
    const casesData = spatialData.find(
      (item) => item.kecamatan_domisili.toLowerCase() === name.toLowerCase()
    );
    const cases = casesData ? casesData.total_cases : 0;

    layer.bindTooltip(
      `<div class="font-josefin text-black text-[13px]">
        <strong>Kecamatan:</strong> ${name}<br/>
        <strong>Kasus:</strong> ${cases}
       </div>`,
      { sticky: true, opacity: 0.95 }
    );

    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.65,
          weight: 2.5
        });
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle(styleFeature(feature));
      },
      click: () => {
        onSelectKecamatan(name);
      }
    });
  };

  // Sleman Center coordinates
  const centerPosition: [number, number] = [-7.69, 110.36];
  const bounds: L.LatLngBoundsExpression = [
    [-7.85, 110.15],
    [-7.53, 110.55]
  ];

  if (!geoJsonData) {
    return (
      <div className="size-full flex items-center justify-center bg-black/5 rounded-[16px] backdrop-blur-sm border border-white/15">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-teal-brand border-t-transparent rounded-full animate-spin" />
          <span className="font-josefin text-[15px] text-[#0c818a]">Memuat Peta Sleman...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-hidden rounded-[16px] border border-white/20 shadow-lg relative bg-white/10 backdrop-blur-md">
      <MapContainer
        center={centerPosition}
        zoom={11}
        minZoom={10}
        maxZoom={13}
        maxBounds={bounds}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <GeoJSON
          key={JSON.stringify(spatialData) + (selectedKecamatanName || "")}
          data={geoJsonData}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
