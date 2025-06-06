import React, { useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material/styles';
import { getThemeColors, lightColors, darkColors } from './theme';
import { ToggleButton, ToggleButtonGroup, Paper, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { Satellite, Map as MapIcon, HighQuality } from '@mui/icons-material';
import MapSideBar from './mapassets/MapSideBar';
// extract images from Leaflet's default icon set path
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';
// tell Leaflet to use these metioned image paths for map objects
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function MapView({
  initialCenter = [1.3362, 103.7440],
  initialZoom   = 18,
  markers       = [],
  linkQualityMatrix = []
}) {
  const theme = useTheme();
  const colors = getThemeColors(theme);
  const mapEl = useRef(null);
  const map   = useRef(null);
  const layer = useRef(null);  const tileLayer = useRef(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [satelliteProvider, setSatelliteProvider] = useState('googleHybrid');
    // Sidebar state management
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Function to handle node click from sidebar
  const handleNodeClick = (node) => {
    if (!map.current || !node.latitude || !node.longitude) return;
    
    const lat = parseFloat(node.latitude);
    const lng = parseFloat(node.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    // Center the map on the selected node
    map.current.setView([lat, lng], 18, {
      animate: true,
      duration: 1
    });
    
    // Set selected node for highlighting
    setSelectedNodeId(node.id);
  };

  // Helper function to get tile URL based on current settings
  const getTileUrl = (isDark, satelliteMode, provider = 'esri') => {
    if (satelliteMode) {
      const satelliteProviders = {
        // Google Satellite - Highest resolution and clarity
        google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        
        // ESRI World Imagery - Good balance of quality and reliability
        esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        
        // Google Hybrid - Satellite with labels and roads
        googleHybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        
        // ESRI World Imagery with Labels
        esriHybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };
      
      return satelliteProviders[provider] || satelliteProviders.esri;
    }
    
    // Regular map modes
    const colorfulDarkOptions = {
      // Stadia Alidade Smooth Dark - Beautiful dark theme with green parks/forests and blue water
      stadia_dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    };
    
    return isDark 
      ? colorfulDarkOptions.stadia_dark  // Dark mode with green vegetation and blue water
      : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';  // Light mode
  };
  // Helper function to get attribution based on current settings
  const getAttribution = (satelliteMode, provider = 'esri') => {
    if (satelliteMode) {
      const attributions = {
        google: '© Google',
        googleHybrid: '© Google',
        esri: '© <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        esriHybrid: '© <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      };
      return attributions[provider] || attributions.esri;
    }
    return '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  };

  // initialize map once
  useEffect(() => {
    map.current = L.map(mapEl.current).setView(initialCenter, initialZoom);
      // Create initial tile layer based on current theme and satellite mode
    const isDark = theme.palette.mode === 'dark';
    const tileUrl = getTileUrl(isDark, isSatellite, satelliteProvider);
    const attribution = getAttribution(isSatellite, satelliteProvider);
    
    tileLayer.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: attribution,
      subdomains: 'abcd'
    }).addTo(map.current);
    
    return () => map.current.remove();
  }, []);
  // Update tile layer when theme or satellite mode changes
  useEffect(() => {
    if (!map.current || !tileLayer.current) return;
      const isDark = theme.palette.mode === 'dark';
    const newTileUrl = getTileUrl(isDark, isSatellite, satelliteProvider);
    const attribution = getAttribution(isSatellite, satelliteProvider);
    
    // Remove current tile layer
    map.current.removeLayer(tileLayer.current);
    
    // Add new tile layer with updated theme/mode
    tileLayer.current = L.tileLayer(newTileUrl, {
      maxZoom: 20,
      attribution: attribution,
      subdomains: 'abcd'
    }).addTo(map.current);
  }, [theme.palette.mode, isSatellite, satelliteProvider]);

    // helper: map SNR (-10..+30) → color (red→green)
  function qualityToColor(q) {
    const min = -10, max = 30;
    // clamp:
    const clamped = Math.max(min, Math.min(max, q));
    const pct = (clamped - min) / (max - min);   // 0..1
    const hue = pct * 120;                       // 0=red, 120=green
    return `hsl(${hue},100%,50%)`;
  }
  
  useEffect(() => {
    if (!map.current) return;

    // clear old layer
    if (layer.current) {
      map.current.removeLayer(layer.current);
    }    // Helper function to get status-based colors
    // Uses inverted theme colors: light colors in dark mode, dark colors in light mode
    const getStatusColors = (nodeStatus) => {
      const isDarkMode = theme.palette.mode === 'dark';
      
      // Use inverted theme colors for better map contrast
      const sourceColors = isDarkMode ? lightColors : darkColors;
      
      if (!nodeStatus) {
        // Use inverted disconnected color
        const statusColor = sourceColors.nodeStatus.disconnected;
        return {
          color: statusColor,
          fillColor: statusColor
        };
      }

      let statusColor;
      switch (nodeStatus) {
        case 'RUNNING':
          statusColor = sourceColors.nodeStatus.running;
          break;
        case 'INITIALIZING':
          statusColor = sourceColors.nodeStatus.initializing;
          break;
        case 'OFF':
          statusColor = sourceColors.nodeStatus.off;
          break;
        case 'DISCONNECTED':
          statusColor = sourceColors.nodeStatus.disconnected;
          break;
        case 'UNREACHABLE':
          statusColor = sourceColors.nodeStatus.unreachable;
          break;
        default:
          statusColor = sourceColors.nodeStatus.disconnected;
      }

      return {
        color: statusColor,
        fillColor: statusColor
      };
    };

    const group = L.layerGroup();    markers.forEach(marker => {
      const lat = parseFloat(marker.latitude)  || 0;
      const lng = parseFloat(marker.longitude) || 0;
      const { latitude, longitude, nodeStatus, ...rest } = marker;
      const label = String(marker.label);
      const popupHtml = Object
        .entries(rest)
        .map(([k,v]) => `<strong>${k}</strong>: ${v}`)
        .join('<br>');

      // Get status-based colors
      const statusColors = getStatusColors(nodeStatus);

      const circle = L.circle([lat, lng], {
        radius:      10,
        color:       statusColors.color,
        fillColor:   statusColors.fillColor,
        fillOpacity: 0.6,
        weight:      2
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

    // draw SNR‐colored links
    const coords = markers.map(m => [
      parseFloat(m.latitude)||0,
      parseFloat(m.longitude)||0
    ]);

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

    group.addTo(map.current);
    layer.current = group;

    // Clean up on unmount
    return () => {
      if (layer.current) {
        map.current.removeLayer(layer.current);
        layer.current = null;
      }
    };
  }, [markers, linkQualityMatrix]);

  //console.log("MapView rendered, markers:", markers);
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapEl}
        style={{ width: '100%', height: '100%' }}
      />
        {/* MapSideBar */}
      <MapSideBar
        nodes={markers}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
        isVisible={isSidebarVisible}
        onToggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)}
        onCollapseChange={setIsSidebarCollapsed}
      />        {/* Satellite View Toggle - positioned relative to sidebar state */}
      <Paper
        elevation={3}
        style={{
          position: 'absolute',
          top: 20,
          right: isSidebarVisible ? (isSidebarCollapsed ? 100 : 360) : 20, // Adjust based on sidebar visibility and collapse state
          zIndex: 1000,
          backgroundColor: colors.background.paper,
          padding: '8px',
        }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          <ToggleButtonGroup
            value={isSatellite ? 'satellite' : 'map'}
            exclusive
            onChange={(event, newValue) => {
              if (newValue !== null) {
                setIsSatellite(newValue === 'satellite');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: colors.text.primary,
                border: `1px solid ${colors.border.main}`,
                '&.Mui-selected': {
                  backgroundColor: colors.primary.main,
                  color: colors.background.paper,
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  },
                },
                '&:hover': {
                  backgroundColor: colors.background.hover,
                },
              },
            }}
          >
            <ToggleButton value="map" aria-label="map view">
              <MapIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="satellite" aria-label="satellite view">
              <Satellite fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Satellite Quality Selector */}
          {isSatellite && (
            <FormControl size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: colors.text.secondary,
                  '&.Mui-focused': { color: colors.primary.main }
                }}
              >
                Quality
              </InputLabel>
              <Select
                value={satelliteProvider}
                onChange={(e) => setSatelliteProvider(e.target.value)}
                label="Quality"
                sx={{
                  minWidth: 120,
                  color: colors.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.border.main,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                  '& .MuiSelect-icon': {
                    color: colors.text.primary,
                  },
                }}
              >
                <MenuItem value="google">🌟 Google (Best)</MenuItem>
                <MenuItem value="googleHybrid">🏷️ Google + Labels</MenuItem>
                <MenuItem value="esri">🗺️ ESRI (Standard)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>
    </div>
  );
}

const areEqual = (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.markers) === JSON.stringify(nextProps.markers) &&
    JSON.stringify(prevProps.linkQualityMatrix) === JSON.stringify(nextProps.linkQualityMatrix)
  );
};

export default React.memo(MapView, areEqual);
