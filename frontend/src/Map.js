import React, { useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material/styles';
import { getThemeColors, lightColors, darkColors } from './theme';
import { ToggleButton, ToggleButtonGroup, Paper, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { Satellite, Map as MapIcon, CloudOff, Cloud } from '@mui/icons-material';
import MapSideBar from './mapassets/MapSideBar';
import { PMTiles, Protocol } from 'pmtiles';
import { leafletLayer, PolygonSymbolizer, LineSymbolizer, CenteredTextSymbolizer } from 'protomaps-leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';

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
  const layer = useRef(null);
  const tileLayer = useRef(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [satelliteProvider, setSatelliteProvider] = useState('googleHybrid');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineMapAvailable, setOfflineMapAvailable] = useState(false);
  const pmtilesRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const handleNodeClick = (node) => {
    if (!map.current || !node.latitude || !node.longitude) return;
    
    const lat = parseFloat(node.latitude);
    const lng = parseFloat(node.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    map.current.setView([lat, lng], 18, {
      animate: true,
      duration: 1
    });
    
    setSelectedNodeId(node.id);
  };

  const getTileUrl = (isDark, satelliteMode, provider = 'esri') => {
    if (satelliteMode) {
      const satelliteProviders = {
        google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        googleHybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        esriHybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };
      
      return satelliteProviders[provider] || satelliteProviders.esri;
    }
    
    const colorfulDarkOptions = {
      stadia_dark: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    };
    
    return isDark 
      ? colorfulDarkOptions.stadia_dark
      : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
  };

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

  useEffect(() => {
    map.current = L.map(mapEl.current).setView(initialCenter, initialZoom);
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

  useEffect(() => {
    const initializePMTiles = async () => {
      try {
        const pmtilesUrl = './offline-maps/singapore.pmtiles';
        const response = await fetch(pmtilesUrl, { method: 'HEAD' });
        
        if (response.ok) {
          pmtilesRef.current = new PMTiles(pmtilesUrl);
          
          if (!window.pmtilesProtocol) {
            window.pmtilesProtocol = new Protocol();
            window.pmtilesProtocol.add(pmtilesRef.current);
          }
          
          setOfflineMapAvailable(true);
          console.log('✅ Singapore offline map available');
          
          try {
            const header = await pmtilesRef.current.getHeader();
            console.log('📍 PMTiles header:', {
              bounds: `${header.minLat}, ${header.minLon} to ${header.maxLat}, ${header.maxLon}`,
              zoom: `${header.minZoom} to ${header.maxZoom}`,
              center: `${header.centerLat}, ${header.centerLon}`
            });
          } catch (headerError) {
            console.error('❌ Error reading PMTiles header:', headerError);
          }
        } else {
          console.log('⚠️ Singapore offline map not found');
          setOfflineMapAvailable(false);
        }
      } catch (error) {
        console.error('❌ Error initializing PMTiles:', error);
        setOfflineMapAvailable(false);
      }
    };
    
    initializePMTiles();
  }, []);

  const createPMTilesLayer = () => {
    if (!pmtilesRef.current) return null;
    
    try {
      const pmtilesLayer = leafletLayer({
        url: pmtilesRef.current,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 15,
        paintRules: [
          // 1. Earth/land background
          {
            dataLayer: "earth", 
            symbolizer: new PolygonSymbolizer({
              fill: "#FAFAFA", // Clean background
              opacity: 1.0
            })
          },
          // 2. Landcover (parks, forests) - ALL GREEN
          {
            dataLayer: "landcover",
            symbolizer: new PolygonSymbolizer({
              fill: "#A5D6A7", // Vibrant green for all landcover
              opacity: 0.9
            })
          },
          // 3. Landuse - SMART STYLING based on kind property
          {
            dataLayer: "landuse",
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind;
                
                // Green landuse types (parks, recreation, forests, etc.)
                const greenTypes = [
                  'park', 'forest', 'recreation_ground', 'recreation', 'green', 'grass',
                  'garden', 'cemetery', 'golf_course', 'nature_reserve', 'wood', 'woods',
                  'meadow', 'farmland', 'farm', 'allotments', 'orchard', 'vineyard',
                  'scrub', 'heath', 'wetland', 'conservation', 'protected_area',
                  'national_park', 'village_green', 'common', 'playground'
                ];
                
                // Check if this landuse should be green
                const isGreen = greenTypes.some(type => 
                  kind && kind.toLowerCase().includes(type.toLowerCase())
                );
                
                if (isGreen) {
                  // Render as green
                  context.fillStyle = "#A5D6A7";
                  context.globalAlpha = 0.9;
                } else {
                  // Render as light gray for urban/commercial landuse
                  context.fillStyle = "#F0F0F0";
                  context.globalAlpha = 0.7;
                }
                
                // Draw the polygon
                context.beginPath();
                for (var poly of geom) {
                  for (var p = 0; p < poly.length - 1; p++) {
                    let pt = poly[p];
                    if (p == 0) context.moveTo(pt.x, pt.y);
                    else context.lineTo(pt.x, pt.y);
                  }
                }
                context.fill();
              }
            }
          },
          // 4. Water bodies - HIGHER OPACITY and different approach
          {
            dataLayer: "water",
            symbolizer: new PolygonSymbolizer({
              fill: "#5B9BD5", // Blue water
              opacity: 1.0 // Full opacity
            })
          },
          // 5. Buildings
          {
            dataLayer: "buildings",
            symbolizer: new PolygonSymbolizer({
              fill: "#E0E0E0",
              stroke: "#BDBDBD",
              width: 0.5,
              opacity: 0.8
            })
          },
          // 6. Roads
          {
            dataLayer: "roads",
            symbolizer: new LineSymbolizer({
              color: "#757575",
              width: 2
            })
          },
          // 7. Boundaries
          {
            dataLayer: "boundaries", 
            symbolizer: new LineSymbolizer({
              color: "#9E9E9E",
              width: 1,
              opacity: 0.5
            })
          }
        ],
        labelRules: [
          {
            dataLayer: "places",
            symbolizer: new CenteredTextSymbolizer({
              labelProps: ["name"],
              fill: "#000000",
              font: "12px Arial",
              stroke: "#FFFFFF",
              width: 2
            })
          },
          {
            dataLayer: "pois", 
            symbolizer: new CenteredTextSymbolizer({
              labelProps: ["name"],
              fill: "#333333", 
              font: "10px Arial"
            })
          }
        ]
      });
      
      console.log('✅ Created protomaps leaflet layer with explicit styling for Singapore PMTiles');
      
      // Add debugging to see what features are actually being rendered
      console.log('🔍 Debugging PMTiles layers:');
      console.log('- Water layer: Blue (#5B9BD5)');
      console.log('- Earth layer: Light gray (#FAFAFA)');
      console.log('- Landuse layer: Light green (#E8F5E8)');
      console.log('- Landcover layer: Muted green (#C8E6C9)');
      console.log('If water bodies appear wrong, they might be in earth/landuse layers with different classification');
      
      return pmtilesLayer;
    } catch (error) {
      console.error('❌ Error creating protomaps layer:', error);
      
      const fallbackLayer = L.tileLayer('', {
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 15,
      });
      
      fallbackLayer.createTile = function(coords, done) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        
        pmtilesRef.current.getZxy(coords.z, coords.x, coords.y)
          .then(result => {
            const ctx = canvas.getContext('2d');
            
            if (result && result.data) {
              const dataSize = result.data.byteLength || result.data.length || 0;
              
              const intensity = Math.min(dataSize / 20000, 1);
              
              if (intensity > 0.7) {
                ctx.fillStyle = '#f8f9fa'; // Urban areas - light gray
              } else if (intensity > 0.4) {
                ctx.fillStyle = '#e9ecef'; // Suburban - lighter gray
              } else if (intensity > 0.1) {
                ctx.fillStyle = '#e3f2fd'; // Low density - light blue
              } else {
                ctx.fillStyle = '#bbdefb'; // Water/empty - blue
              }
              
              ctx.fillRect(0, 0, 256, 256);
              
              if (intensity > 0.3) {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                for (let i = 0; i < intensity * 10; i++) {
                  ctx.beginPath();
                  ctx.moveTo(Math.random() * 256, Math.random() * 256);
                  ctx.lineTo(Math.random() * 256, Math.random() * 256);
                  ctx.stroke();
                }
              }
              
              ctx.strokeStyle = 'rgba(0,0,0,0.1)';
              ctx.lineWidth = 1;
              ctx.strokeRect(0, 0, 256, 256);
              
              console.log(`🗺️ Rendered fallback tile ${coords.z}/${coords.x}/${coords.y}: ${dataSize} bytes`);
            } else {
              ctx.fillStyle = '#81c784';
              ctx.fillRect(0, 0, 256, 256);
            }
            
            done(null, canvas);
          })
          .catch(error => {
            console.error(`❌ Error in fallback tile ${coords.z}/${coords.x}/${coords.y}:`, error);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcdd2';
            ctx.fillRect(0, 0, 256, 256);
            done(null, canvas);
          });
        
        return canvas;
      };
      
      console.log('⚠️ Using fallback tile rendering');
      return fallbackLayer;
    }
  };

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
        attribution: attribution,
        subdomains: 'abcd'
      }).addTo(map.current);
    }
  }, [theme.palette.mode, isSatellite, satelliteProvider, isOfflineMode, offlineMapAvailable]);

  function qualityToColor(q) {
    const min = -10, max = 30;
    const clamped = Math.max(min, Math.min(max, q));
    const pct = (clamped - min) / (max - min);   // 0..1
    const hue = pct * 120;                       // 0=red, 120=green
    return `hsl(${hue},100%,50%)`;
  }

  function txPowerToRadius(txPower) {
    if (txPower === null || txPower === undefined || isNaN(parseFloat(txPower))) {
      return 3; // Default radius when txPower is not available (reduced from 10)
    }
    
    const power = parseFloat(txPower);
    const minPower = -1;
    const maxPower = 3;
    const minRadius = 6;   // Minimum circle radius (for txPower = -1)
    const maxRadius = 18;  // Maximum circle radius (for txPower = 3)
    
    const clampedPower = Math.max(minPower, Math.min(maxPower, power));
    
    const normalizedPower = (clampedPower - minPower) / (maxPower - minPower); // 0..1
    const radius = minRadius + (normalizedPower * (maxRadius - minRadius));
    
    return Math.round(radius);
  }
  
  useEffect(() => {
    if (!map.current) return;

    if (layer.current) {
      map.current.removeLayer(layer.current);
    }    const getStatusColors = (nodeStatus) => {
      const isDarkMode = theme.palette.mode === 'dark';
      
      const sourceColors = isDarkMode ? lightColors : darkColors;
      
      if (!nodeStatus) {
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
      const { latitude, longitude, nodeStatus, txPower, ...rest } = marker;
      const label = String(marker.label);
      
      const radius = txPowerToRadius(txPower);
      
      const popupEntries = Object.entries(rest).map(([k,v]) => `<strong>${k}</strong>: ${v}`);
      if (txPower !== null && txPower !== undefined) {
        popupEntries.unshift(`<strong>TX Power</strong>: ${txPower} dBm`);
      }
      const popupHtml = popupEntries.join('<br>');

      const statusColors = getStatusColors(nodeStatus);

      const circle = L.circle([lat, lng], {
        radius:      radius, // Use calculated radius based on txPower
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

    return () => {
      if (layer.current) {
        map.current.removeLayer(layer.current);
        layer.current = null;
      }
    };
  }, [markers, linkQualityMatrix]);

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
      />        {/* Control Panel - positioned relative to sidebar state */}
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
          {/* Offline/Online Toggle */}
          {offlineMapAvailable && (
            <ToggleButtonGroup
              value={isOfflineMode ? 'offline' : 'online'}
              exclusive
              onChange={(event, newValue) => {
                if (newValue !== null) {
                  setIsOfflineMode(newValue === 'offline');
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
              <ToggleButton value="online" aria-label="online maps">
                <Cloud fontSize="small" />
              </ToggleButton>
              <ToggleButton value="offline" aria-label="offline maps">
                <CloudOff fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          
          {/* Satellite/Map Toggle - only show in online mode */}
          {!isOfflineMode && (
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
          )}
          
          {/* Satellite Quality Selector - only show in online satellite mode */}
          {!isOfflineMode && isSatellite && (
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
          
          {/* Offline Map Status Indicator */}
          {isOfflineMode && (
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1}
              sx={{
                padding: '4px 8px',
                backgroundColor: colors.success?.main || '#4caf50',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'white',
              }}
            >
              <CloudOff fontSize="small" />
              <span>Offline Mode</span>
            </Box>
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
