import React from 'react';
import { MapContainer, ImageOverlay, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Category } from '../data';

const bounds = [[0, 0], [1000, 1000]];

// 🚨 [중요] 본인의 레포지토리 이름 정확히 입력 (/문자열)
const BASE_PATH = "/dudutaMap_renewer"; 

const MapComponent = ({ markers = [] }) => {

  const getIconUrl = (itemId) => {
    for (const group of Object.values(Category)) {
      const item = group.find(i => i.id === itemId);
      
      if (item && item.image) {
        // 1. 데이터(data.js)에 적힌 이미지 경로 가져오기
        let rawPath = item.image;

        // 2. 만약 경로 앞에 '/'가 있다면 제거 (중복 방지)
        // 예: "/icons/panda.png" -> "icons/panda.png"
        if (rawPath.startsWith('/')) {
          rawPath = rawPath.slice(1);
        }

        // 3. BASE_PATH와 합치기
        // 결과: "/dudutaMap_renewer/icons/panda.png"
        const finalPath = `${BASE_PATH}/${rawPath}`;
        
        // 🚨 [디버깅] F12 -> Console 탭에서 이 주소가 맞는지 확인해보세요!
        // console.log(`아이콘 로딩 시도: ${finalPath}`);
        
        return finalPath;
      }
    }
    return null;
  };

  const createCustomIcon = (iconUrl) => {
    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'custom-marker-icon'
    });
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      center={[500, 500]}
      zoom={-1}
      minZoom={-3}
      maxZoom={3}
      maxBounds={[[-2000, -2000], [3000, 3000]]}
      maxBoundsViscosity={0}
      style={{ height: '100%', width: '100%', background: '#aad3df' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* 지도 이미지도 BASE_PATH 적용 */}
      <ImageOverlay url={`${BASE_PATH}/duduMap.png`} bounds={bounds} />

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