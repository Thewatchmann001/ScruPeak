import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Card, Spin, message, Select } from 'antd';
import { useGridStore, useParcelStore } from '../services/store';

export const MapVisualization = () => {
  const { grids, getHierarchy, loading: gridLoading } = useGridStore();
  const { parcels, fetchParcels, loading: parcelLoading } = useParcelStore();
  const [selectedGrid, setSelectedGrid] = useState(null);

  useEffect(() => {
    getHierarchy();
  }, [getHierarchy]);

  useEffect(() => {
    if (selectedGrid) {
      fetchParcels(selectedGrid);
    }
  }, [selectedGrid, fetchParcels]);

  const convertCoordinates = (geometry) => {
    if (!geometry) return [];
    try {
      const coords = JSON.parse(geometry);
      return coords.map(([lat, lng]) => [lat, lng]);
    } catch {
      return [];
    }
  };

  const loading = gridLoading || parcelLoading;

  return (
    <div style={{ padding: '24px' }}>
      <h2>Spatial Visualization</h2>

      <Card style={{ marginBottom: '16px' }}>
        <Select
          placeholder="Select a grid"
          style={{ width: '100%' }}
          onChange={setSelectedGrid}
          options={grids.map((grid) => ({
            label: `${grid.grid_code} - ${grid.grid_name}`,
            value: grid.id,
          }))}
        />
      </Card>

      <Spin spinning={loading}>
        <MapContainer
          center={[0, 0]}
          zoom={6}
          style={{ height: '500px', width: '100%', borderRadius: '4px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {parcels.map((parcel) => {
            const coordinates = convertCoordinates(parcel.geometry);
            if (coordinates.length === 0) return null;

            return (
              <Polygon
                key={parcel.id}
                positions={coordinates}
                color={parcel.active ? '#1890ff' : '#ff4d4f'}
                weight={2}
              >
                <Popup>
                  <div>
                    <p><strong>{parcel.parcel_code}</strong></p>
                    <p>Area: {parcel.area_sqm.toFixed(2)} sq m</p>
                    <p>Status: {parcel.active ? 'Active' : 'Inactive'}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </Spin>
    </div>
  );
};

export default MapVisualization;
