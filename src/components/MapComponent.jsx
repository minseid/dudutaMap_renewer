import React from 'react';
import { MapContainer, ImageOverlay, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Category } from '../data';

// 맵 크기 설정
const bounds = [[0, 0], [1000, 1000]];
const BASE_PATH = "/dudutaMap_renewer";

const MapComponent = ({ markers = [] }) => {

  const getIconUrl = (itemId) => {
    for (const group of Object.values(Category)) {
      const item = group.find(i => i.id === itemId);
      if (item && item.image && item.image.includes('/')) {
        return item.image;
      }
    }
    return null;
  };

  const createCustomIcon = (iconUrl) => {
    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      center={[500, 500]}
      zoom={0}
      minZoom={-2} 
      style={{ height: '100%', width: '100%', background: '#cccccc' }}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}    
      zoomControl={false}
    >
      <ImageOverlay url="/duduMap.jpg" bounds={bounds} />

      {markers.map((marker, index) => {
        const iconUrl = getIconUrl(marker.category);
        const markerIcon = iconUrl ? createCustomIcon(iconUrl) : new L.Icon.Default();

        return (
          <Marker 
            key={index} 
            position={marker.position} 
            icon={markerIcon}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;