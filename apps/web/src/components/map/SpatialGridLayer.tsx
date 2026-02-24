import React, { useEffect, useState } from 'react';
import { useMap, Polyline, Tooltip } from 'react-leaflet';
import proj4 from 'proj4';

// Sierra Leone UTM Zone 28N
const UTM_28N = "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs";
const WGS84 = "EPSG:4326";

// National Grid Constants
const ORIGIN_LAT = 6.90;
const ORIGIN_LON = -13.30;
const GRID_SIZE_METERS = 2000;
const TOTAL_GRIDS_EAST = 200;

interface GridCell {
  id: number;
  bounds: [number, number][]; // lat, lon
  center: [number, number];
}

export const SpatialGridLayer: React.FC = () => {
  const map = useMap();
  const [gridLines, setGridLines] = useState<any[]>([]);
  const [activeGridId, setActiveGridId] = useState<number | null>(null);

  useEffect(() => {
    const updateGrid = () => {
      const zoom = map.getZoom();
      if (zoom < 12) {
        setGridLines([]);
        return;
      }

      const bounds = map.getBounds();
      const sw = proj4(WGS84, UTM_28N, [bounds.getWest(), bounds.getSouth()]);
      const ne = proj4(WGS84, UTM_28N, [bounds.getEast(), bounds.getNorth()]);
      const originUtm = proj4(WGS84, UTM_28N, [ORIGIN_LON, ORIGIN_LAT]);

      const lines: any[] = [];

      // Calculate grid range in view
      const minX = Math.floor((sw[0] - originUtm[0]) / GRID_SIZE_METERS);
      const maxX = Math.ceil((ne[0] - originUtm[0]) / GRID_SIZE_METERS);
      const minY = Math.floor((sw[1] - originUtm[1]) / GRID_SIZE_METERS);
      const maxY = Math.ceil((ne[1] - originUtm[1]) / GRID_SIZE_METERS);

      // Limit search to reasonable range to avoid browser hang
      const safeMinX = Math.max(0, minX);
      const safeMinY = Math.max(0, minY);
      const safeMaxX = Math.min(maxX, TOTAL_GRIDS_EAST);
      const safeMaxY = Math.min(maxY, 500); // Reasonable vertical limit

      // Vertical lines
      for (let x = safeMinX; x <= safeMaxX; x++) {
        const utmX = originUtm[0] + x * GRID_SIZE_METERS;
        const p1 = proj4(UTM_28N, WGS84, [utmX, sw[1]]);
        const p2 = proj4(UTM_28N, WGS84, [utmX, ne[1]]);
        lines.push({
          positions: [[p1[1], p1[0]], [p2[1], p2[0]]],
          key: `v-${x}`
        });
      }

      // Horizontal lines
      for (let y = safeMinY; y <= safeMaxY; y++) {
        const utmY = originUtm[1] + y * GRID_SIZE_METERS;
        const p1 = proj4(UTM_28N, WGS84, [sw[0], utmY]);
        const p2 = proj4(UTM_28N, WGS84, [ne[0], utmY]);
        lines.push({
          positions: [[p1[1], p1[0]], [p2[1], p2[0]]],
          key: `h-${y}`
        });
      }

      setGridLines(lines);
    };

    map.on('moveend', updateGrid);
    map.on('zoomend', updateGrid);
    updateGrid();

    return () => {
      map.off('moveend', updateGrid);
      map.off('zoomend', updateGrid);
    };
  }, [map]);

  // Handle mouse interaction to show Grid ID
  useEffect(() => {
    const onMouseMove = (e: any) => {
      const latlng = e.latlng;
      try {
        const utm = proj4(WGS84, UTM_28N, [latlng.lng, latlng.lat]);
        const originUtm = proj4(WGS84, UTM_28N, [ORIGIN_LON, ORIGIN_LAT]);

        const dx = utm[0] - originUtm[0];
        const dy = utm[1] - originUtm[1];

        if (dx >= 0 && dy >= 0) {
          const gx = Math.floor(dx / GRID_SIZE_METERS);
          const gy = Math.floor(dy / GRID_SIZE_METERS);
          const gridId = gy * TOTAL_GRIDS_EAST + gx;
          setActiveGridId(gridId);
        } else {
          setActiveGridId(null);
        }
      } catch (err) {
        setActiveGridId(null);
      }
    };

    map.on('mousemove', onMouseMove);
    return () => {
      map.off('mousemove', onMouseMove);
    };
  }, [map]);

  return (
    <>
      {gridLines.map(line => (
        <Polyline
          key={line.key}
          positions={line.positions}
          pathOptions={{ color: '#fb923c', weight: 1, opacity: 0.4, dashArray: '5, 10' }}
          interactive={false}
        />
      ))}
      {activeGridId !== null && map.getZoom() >= 14 && (
        <div className="absolute bottom-20 left-4 z-[1000] bg-orange-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold border-2 border-white animate-in fade-in slide-in-from-bottom-2">
          Spatial ID: {activeGridId.toString().padStart(5, '0')}
        </div>
      )}
    </>
  );
};
