import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material/styles';
import { getThemeColors, lightColors, darkColors } from './theme';
import MapSideBar from './mapassets/MapSideBar';
import MapControls from './mapassets/MapControls';
import { useOfflineMaps } from './mapassets/OfflineMapsHandler';
import { getTileUrl, getAttribution, qualityToColor, txPowerToRadius, getStatusColors } from './mapassets/MapUtils';

// Configure Leaflet default icon
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function MapView({
  initialCenter = [1.3362, 103.7440],
  initialZoom = 18,
  markers = [],
  linkQualityMatrix = []
}) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const mapEl = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const tileLayer = useRef(null);
  
  // State for map controls and appearance
  const [isSatellite, setIsSatellite] = useState(false);
  const [satelliteProvider, setSatelliteProvider] = useState('googleHybrid');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isLegendsVisible, setIsLegendsVisible] = useState(false);
  
  // Import offline map functionality from custom hook
  const {
    offlineMapAvailable,
    availableOfflineMaps,
    selectedOfflineMap,
    isOfflineMode,
    setIsOfflineMode,
    switchOfflineMap: baseOfflineMapSwitch,
    createPMTilesLayer
  } = useOfflineMaps(theme);

  // Function to handle node clicks
  const handleNodeClick = (node) => {
    if (!map.current || !node.latitude || !node.longitude) return;
    
    const lat = parseFloat(node.latitude);
    const lng = parseFloat(node.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    map.current.setView([lat, lng], 18, { animate: true, duration: 1 });
    setSelectedNodeId(node.id);
  };

  // Wrapper for switchOfflineMap that passes the map reference
  const switchOfflineMap = (mapId) => baseOfflineMapSwitch(mapId, map.current);

  // Initialize the map
  useEffect(() => {
    map.current = L.map(mapEl.current).setView(initialCenter, initialZoom);
    const isDark = theme.palette.mode === 'dark';
    const tileUrl = getTileUrl(isDark, isSatellite, satelliteProvider);
    const attribution = getAttribution(isSatellite, satelliteProvider);
    
    tileLayer.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution,
      subdomains: 'abcd'
    }).addTo(map.current);
    
    // Add scale control to the map
    L.control.scale({
      maxWidth: 200,
      metric: true,
      imperial: true,
      position: 'bottomleft'
    }).addTo(map.current);
    
    // Add coordinates display control
    const coordControl = L.control({position: 'bottomright'});
    coordControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-control-coordinates');
      div.innerHTML = 'Coordinates: 0.0000°, 0.0000°';
      div.style.backgroundColor = theme.palette.mode === 'dark' ? '#333333' : '#ffffff';
      div.style.padding = '6px 8px';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      div.style.color = theme.palette.mode === 'dark' ? '#ffffff' : '#333333';
      div.style.border = `1px solid ${theme.palette.mode === 'dark' ? '#555555' : '#dddddd'}`;
      return div;
    };
    coordControl.addTo(map.current);
    
    // Update coordinates display on mouse move
    map.current.on('mousemove', function(e) {
      const coordDiv = document.querySelector('.leaflet-control-coordinates');
      if (coordDiv) {
        coordDiv.innerHTML = `Coordinates: ${e.latlng.lat.toFixed(6)}°, ${e.latlng.lng.toFixed(6)}°`;
      }
    });
    
    return () => map.current.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer when theme, satellite mode, or offline mode changes
  useEffect(() => {
    if (!map.current || !tileLayer.current) return;
    
    map.current.removeLayer(tileLayer.current);
    
    if (isOfflineMode && offlineMapAvailable) {
      tileLayer.current = createPMTilesLayer();
      if (tileLayer.current) {
        tileLayer.current.addTo(map.current);
      }
    } else {
      const isDark = theme.palette.mode === 'dark';
      const newTileUrl = getTileUrl(isDark, isSatellite, satelliteProvider);
      const attribution = getAttribution(isSatellite, satelliteProvider);
      
      tileLayer.current = L.tileLayer(newTileUrl, {
        maxZoom: 20,
        attribution,
        subdomains: 'abcd'
      }).addTo(map.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.palette.mode, isSatellite, satelliteProvider, isOfflineMode, offlineMapAvailable, selectedOfflineMap]);

  // Update markers and links when data changes
  useEffect(() => {
    if (!map.current) return;
    if (layer.current) map.current.removeLayer(layer.current);
    
    // Create a new layer group for markers and links
    const group = L.layerGroup();
    
    // Add markers for each node
    markers.forEach(marker => {
      const lat = parseFloat(marker.latitude) || 0;
      const lng = parseFloat(marker.longitude) || 0;
      const { latitude, longitude, nodeStatus, txPower, ...rest } = marker;
      const label = String(marker.label);
      
      const radius = txPowerToRadius(txPower);
      
      // Create popup content
      const popupEntries = Object.entries(rest).map(([k,v]) => `<strong>${k}</strong>: ${v}`);
      if (txPower !== null && txPower !== undefined) {
        popupEntries.unshift(`<strong>TX Power</strong>: ${txPower} dBm`);
      }
      const popupHtml = popupEntries.join('<br>');

      // Get color based on node status
      const isDarkMode = theme.palette.mode === 'dark';
      const sourceColors = isDarkMode ? lightColors : darkColors;
      const statusColors = getStatusColors(nodeStatus, sourceColors);

      // Create and add the circle marker
      const circle = L.circle([lat, lng], {
        radius,
        color: statusColors.color,
        fillColor: statusColors.fillColor,
        fillOpacity: 0.6,
        weight: 2
      }).addTo(group)
        .bindPopup(popupHtml)
        .bindTooltip(label, { 
          permanent: true, 
          direction: 'top', 
          offset: [0, -10],
          className: 'leaflet-tooltip-custom'
        });
      circle.on('click', function(e) { this.openPopup(); });
    });

    // Extract coordinates for link drawing
    const coords = markers.map(m => [
      parseFloat(m.latitude) || 0,
      parseFloat(m.longitude) || 0
    ]);

    // Draw links between nodes
    for (let i = 0; i < markers.length; i++) {
      for (let j = i + 1; j < markers.length; j++) {
        const id1 = markers[i].id, id2 = markers[j].id;
        const q = linkQualityMatrix[id1]?.[id2];
        if (typeof q === 'number') {
          L.polyline([coords[i], coords[j]], {
            color: qualityToColor(q),
            weight: 3
          }).addTo(group);
        }
      }
    }

    // Add the layer group to the map
    group.addTo(map.current);
    layer.current = group;

    // Clean up on unmount
    return () => {
      if (layer.current) {
        map.current.removeLayer(layer.current);
        layer.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, linkQualityMatrix]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapEl} style={{ width: '100%', height: '100%' }} />
      
      <MapSideBar
        nodes={markers}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
        isVisible={isSidebarVisible}
        onToggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      <MapControls 
        theme={theme}
        colors={colors}
        isSidebarVisible={isSidebarVisible}
        isSidebarCollapsed={isSidebarCollapsed}
        isOfflineMode={isOfflineMode}
        setIsOfflineMode={setIsOfflineMode}
        isSatellite={isSatellite}
        setIsSatellite={setIsSatellite}
        satelliteProvider={satelliteProvider}
        setSatelliteProvider={setSatelliteProvider}
        offlineMapAvailable={offlineMapAvailable}
        availableOfflineMaps={availableOfflineMaps}
        selectedOfflineMap={selectedOfflineMap}
        switchOfflineMap={switchOfflineMap}
        isLegendsVisible={isLegendsVisible}
        setIsLegendsVisible={setIsLegendsVisible}
      />
    </div>
  );
}

// Improved memoization with more efficient comparison
const areEqual = (prevProps, nextProps) => {
  // Use length and specific properties for faster comparison before JSON.stringify
  const prevMarkers = prevProps.markers;
  const nextMarkers = nextProps.markers;
  if (prevMarkers.length !== nextMarkers.length) return false;
  
  const prevMatrix = prevProps.linkQualityMatrix;
  const nextMatrix = nextProps.linkQualityMatrix;
  const prevKeys = Object.keys(prevMatrix);
  const nextKeys = Object.keys(nextMatrix);
  if (prevKeys.length !== nextKeys.length) return false;
  
  // Fall back to full comparison if quick checks pass
  return (
    JSON.stringify(prevMarkers) === JSON.stringify(nextMarkers) &&
    JSON.stringify(prevMatrix) === JSON.stringify(nextMatrix)
  );
};

export default React.memo(MapView, areEqual);
