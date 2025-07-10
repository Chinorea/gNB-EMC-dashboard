import React, { useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material/styles';
import { getThemeColors, lightColors, darkColors } from './theme';
import { ToggleButton, ToggleButtonGroup, Paper, Select, MenuItem, FormControl, InputLabel, Box, Collapse, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Satellite, Map as MapIcon, CloudOff, Cloud, ExpandMore, ExpandLess, Terrain, Info, GridOn } from '@mui/icons-material';
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
  const [availableOfflineMaps, setAvailableOfflineMaps] = useState([]);
  const [selectedOfflineMap, setSelectedOfflineMap] = useState('auto');
  const pmtilesRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isLegendsVisible, setIsLegendsVisible] = useState(false);

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
  }, []);

  useEffect(() => {
    const initializePMTiles = async () => {
      const offlineMaps = [
        {
          id: 'singapore',
          name: 'Singapore',
          url: './offline-maps/singapore.pmtiles',
          bounds: { north: 1.5, south: 1.2, east: 104.1, west: 103.6 },
          center: [1.3521, 103.8198], // Singapore city center (Marina Bay area)
          zoom: 18
        },
        {
          id: 'queensland',
          name: 'Queensland, Australia',
          url: './offline-maps/queensland.pmtiles',
          bounds: { north: -10.4, south: -29.2, east: 153.6, west: 138.0 },
          center: [-23.3781, 150.5144], // Rockhampton city center coordinates
          zoom: 6
        },
        {
          id: 'shoalwater_bay',
          name: 'Shoalwater Bay Area, Australia',
          url: './offline-maps/shoalwater_bay_area.pmtiles',
          bounds: { north: -22.0, south: -23.0, east: 150.5, west: 149.5 },
          center: [-22.5, 150.3], // Shoalwater Bay center coordinates - shifted right
          zoom: 12
        }
      ];

      const availableMaps = [];

      for (const mapConfig of offlineMaps) {
        try {
          const response = await fetch(mapConfig.url, { method: 'HEAD' });
          
          if (response.ok) {
            const pmtiles = new PMTiles(mapConfig.url);
            
            try {
              const header = await pmtiles.getHeader();
              const mapInfo = {
                ...mapConfig,
                pmtiles,
                header,
                size: response.headers.get('content-length') || 'Unknown'
              };
              
              availableMaps.push(mapInfo);
              console.log(`✅ ${mapConfig.name} offline map available`, {
                bounds: `${header.minLat}, ${header.minLon} to ${header.maxLat}, ${header.maxLon}`,
                zoom: `${header.minZoom} to ${header.maxZoom}`,
                center: `${header.centerLat}, ${header.centerLon}`,
                size: mapInfo.size
              });
            } catch (headerError) {
              console.error(`❌ Error reading ${mapConfig.name} PMTiles header:`, headerError);
            }
          } else {
            console.log(`⚠️ ${mapConfig.name} offline map not found`);
          }
        } catch (error) {
          console.error(`❌ Error checking ${mapConfig.name} offline map:`, error);
        }
      }

      setAvailableOfflineMaps(availableMaps);
      setOfflineMapAvailable(availableMaps.length > 0);
      
      // Default to Singapore if available, otherwise first available map
      if (availableMaps.length > 0) {
        const singaporeMap = availableMaps.find(map => map.id === 'singapore');
        const defaultMap = singaporeMap || availableMaps[0];
        
        pmtilesRef.current = defaultMap.pmtiles;
        setSelectedOfflineMap(defaultMap.id);
        
        if (!window.pmtilesProtocol) {
          window.pmtilesProtocol = new Protocol();
        }
        window.pmtilesProtocol.add(pmtilesRef.current);
        
        console.log(`🎯 Set ${defaultMap.name} as default offline map`);
      }
    };
    
    initializePMTiles();
  }, []);

  const switchOfflineMap = (mapId) => {
    const selectedMap = availableOfflineMaps.find(map => map.id === mapId);
    if (selectedMap) {
      pmtilesRef.current = selectedMap.pmtiles;
      setSelectedOfflineMap(mapId);
      
      // Update map view to center on the new map
      if (map.current) {
        map.current.setView(selectedMap.center, selectedMap.zoom);
      }
      
      // Refresh the tile layer if we're in offline mode
      if (isOfflineMode && tileLayer.current) {
        map.current.removeLayer(tileLayer.current);
        tileLayer.current = createPMTilesLayer();
        if (tileLayer.current) {
          tileLayer.current.addTo(map.current);
        }
      }
      
      console.log(`🔄 Switched to ${selectedMap.name} offline map`);
    }
  };

  const createPMTilesLayer = () => {
    if (!pmtilesRef.current) return null;
    
    try {
      const pmtilesLayer = leafletLayer({
        url: pmtilesRef.current,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 15,
        paintRules: [
          // 1. Earth/land background - more robust detection
          {
            dataLayer: "earth", 
            symbolizer: new PolygonSymbolizer({
              fill: theme.palette.mode === 'dark' ? "#1a1a1a" : "#F5F5DC", // Beige for better Australia land appearance
              opacity: 1.0
            })
          },
          // 1b. Alternative land layer names for different PMTiles sources
          {
            dataLayer: "land", 
            symbolizer: new PolygonSymbolizer({
              fill: theme.palette.mode === 'dark' ? "#1a1a1a" : "#F5F5DC",
              opacity: 1.0
            })
          },
          {
            dataLayer: "natural", 
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.natural || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                // More comprehensive land detection
                const landTypes = ['land', 'earth', 'continent', 'island', 'ground'];
                const isLand = landTypes.some(type => 
                  kind && kind.toLowerCase().includes(type.toLowerCase())
                );
                
                if (isLand || !kind) { // Default to land if no kind specified
                  context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
                  context.globalAlpha = 1.0;
                  
                  context.beginPath();
                  for (var poly of geom) {
                    for (var p = 0; p < poly.length - 1; p++) {
                      let pt = poly[p];
                      if (p === 0) context.moveTo(pt.x, pt.y);
                      else context.lineTo(pt.x, pt.y);
                    }
                  }
                  context.fill();
                }
              }
            }
          },
          
          // 1c. Physical layer - sometimes continents are in physical layer
          {
            dataLayer: "physical",
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                if (!kind || kind === 'land' || kind === 'continent') {
                  context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
                  context.globalAlpha = 1.0;
                  
                  context.beginPath();
                  for (var poly of geom) {
                    for (var p = 0; p < poly.length - 1; p++) {
                      let pt = poly[p];
                      if (p === 0) context.moveTo(pt.x, pt.y);
                      else context.lineTo(pt.x, pt.y);
                    }
                  }
                  context.fill();
                }
              }
            }
          },
          
          // 1d. Fallback for any polygon without water properties
          {
            dataLayer: "*", // Catch-all for any remaining polygons
            symbolizer: {
              draw: function(context, geom, z, feature) {
                if (geom[0] && geom[0].length > 3) { // Only for polygons
                  const props = feature.props || {};
                  const isWater = props.natural === 'water' || props.landuse === 'water' || 
                                props.kind === 'water' || props.class === 'water' ||
                                props.natural === 'bay' || props.natural === 'sea' ||
                                props.natural === 'ocean' || props.natural === 'lake' ||
                                props.natural === 'river';
                  
                  if (!isWater) {
                    const isDark = theme.palette.mode === 'dark';
                    context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
                    context.globalAlpha = 0.3; // Lower opacity for fallback
                    
                    context.beginPath();
                    for (var poly of geom) {
                      for (var p = 0; p < poly.length - 1; p++) {
                        let pt = poly[p];
                        if (p === 0) context.moveTo(pt.x, pt.y);
                        else context.lineTo(pt.x, pt.y);
                      }
                    }
                    context.fill();
                  }
                }
              }
            }
          },
          
          // 2. Landcover (parks, forests, vegetation) - enhanced for Australia
          {
            dataLayer: "landcover",
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.landcover || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                // Australian vegetation types
                const vegetationTypes = [
                  'forest', 'wood', 'woods', 'scrub', 'grass', 'grassland',
                  'heath', 'shrubland', 'bushland', 'woodland', 'trees'
                ];
                
                const isVegetation = vegetationTypes.some(type => 
                  kind && kind.toLowerCase().includes(type.toLowerCase())
                );
                
                if (isVegetation) {
                  context.fillStyle = isDark ? "#2d4a2d" : "#90B090"; // Better Australian bush color
                  context.globalAlpha = 0.8;
                  
                  context.beginPath();
                  for (var poly of geom) {
                    for (var p = 0; p < poly.length - 1; p++) {
                      let pt = poly[p];
                      if (p === 0) context.moveTo(pt.x, pt.y);
                      else context.lineTo(pt.x, pt.y);
                    }
                  }
                  context.fill();
                }
              }
            }
          },
          
          // 3. Landuse - Enhanced for Australian land types
          {
            dataLayer: "landuse",
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.landuse || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                // Australian-specific land use types
                const greenTypes = [
                  'park', 'forest', 'recreation_ground', 'recreation', 'green', 'grass',
                  'garden', 'cemetery', 'golf_course', 'nature_reserve', 'wood', 'woods',
                  'meadow', 'farmland', 'farm', 'allotments', 'orchard', 'vineyard',
                  'scrub', 'heath', 'wetland', 'conservation', 'protected_area',
                  'national_park', 'village_green', 'common', 'playground',
                  // Australian specific
                  'bushland', 'pastoral', 'grazing', 'station', 'outback'
                ];
                
                const urbanTypes = [
                  'residential', 'commercial', 'industrial', 'retail', 'office',
                  'institutional', 'educational', 'hospital', 'parking'
                ];
                
                const isGreen = greenTypes.some(type => 
                  kind && kind.toLowerCase().includes(type.toLowerCase())
                );
                
                const isUrban = urbanTypes.some(type => 
                  kind && kind.toLowerCase().includes(type.toLowerCase())
                );
                
                if (isGreen) {
                  context.fillStyle = isDark ? "#2d4a2d" : "#90B090";
                  context.globalAlpha = 0.7;
                } else if (isUrban) {
                  context.fillStyle = isDark ? "#3a3a3a" : "#E8E8E8";
                  context.globalAlpha = 0.6;
                } else if (kind) {
                  // Default for other landuse types
                  context.fillStyle = isDark ? "#2a2a2a" : "#F0F0F0";
                  context.globalAlpha = 0.5;
                } else {
                  return; // Don't draw if no kind specified
                }
                
                context.beginPath();
                for (var poly of geom) {
                  for (var p = 0; p < poly.length - 1; p++) {
                    let pt = poly[p];
                    if (p === 0) context.moveTo(pt.x, pt.y);
                    else context.lineTo(pt.x, pt.y);
                  }
                }
                context.fill();
              }
            }
          },
          
          // 4. Water bodies - enhanced for Australian water features
          {
            dataLayer: "water",
            symbolizer: new PolygonSymbolizer({
              fill: theme.palette.mode === 'dark' ? "#162c46" : "#7bafd4", // Dulled down water blue
              opacity: 1.0
            })
          },
          
          // 4b. Alternative water layer names
          {
            dataLayer: "waterway",
            symbolizer: new LineSymbolizer({
              color: theme.palette.mode === 'dark' ? "#162c46" : "#7bafd4", // Dulled down water blue
              width: 2
            })
          },
          
          // 5. Buildings - theme aware gray
          {
            dataLayer: "buildings",
            symbolizer: new PolygonSymbolizer({
              fill: theme.palette.mode === 'dark' ? "#3a3a3a" : "#D0D0D0",
              stroke: theme.palette.mode === 'dark' ? "#555555" : "#BDBDBD",
              width: 0.5,
              opacity: 0.8
            })
          },
          
          // 6. Roads - enhanced for Australian road network
          {
            dataLayer: "roads",
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.highway || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                let color = isDark ? "#666666" : "#757575";
                let width = 1;
                
                // Australian road hierarchy
                if (kind === 'highway' || kind === 'motorway') {
                  color = isDark ? "#FF8C00" : "#FF6B00"; // Orange for highways
                  width = 4;
                } else if (kind === 'primary' || kind === 'trunk') {
                  color = isDark ? "#FFD700" : "#FFA500"; // Gold for primary roads
                  width = 3;
                } else if (kind === 'secondary') {
                  color = isDark ? "#87CEEB" : "#4682B4"; // Steel blue for secondary
                  width = 2;
                } else if (kind === 'tertiary' || kind === 'residential') {
                  color = isDark ? "#999999" : "#666666"; // Gray for local roads
                  width = 1.5;
                }
                
                context.strokeStyle = color;
                context.lineWidth = width;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                
                context.beginPath();
                for (var line of geom) {
                  for (var p = 0; p < line.length; p++) {
                    let pt = line[p];
                    if (p === 0) context.moveTo(pt.x, pt.y);
                    else context.lineTo(pt.x, pt.y);
                  }
                }
                context.stroke();
              }
            }
          },
          
          // 7. Boundaries - Australian state/territory boundaries
          {
            dataLayer: "boundaries", 
            symbolizer: {
              draw: function(context, geom, z, feature) {
                const kind = feature.props?.kind || feature.props?.admin_level || feature.props?.class;
                const isDark = theme.palette.mode === 'dark';
                
                let color = isDark ? "#777777" : "#9E9E9E";
                let width = 1;
                
                // Australian administrative boundaries
                if (kind === 'state' || kind === 'territory' || feature.props?.admin_level === '4') {
                  color = isDark ? "#FF69B4" : "#D2691E"; // Hot pink/orange for state boundaries
                  width = 2;
                } else if (kind === 'local' || feature.props?.admin_level === '6') {
                  color = isDark ? "#87CEEB" : "#708090"; // Light blue for local boundaries
                  width = 1;
                }
                
                context.strokeStyle = color;
                context.lineWidth = width;
                context.globalAlpha = 0.7;
                
                context.beginPath();
                for (var line of geom) {
                  for (var p = 0; p < line.length; p++) {
                    let pt = line[p];
                    if (p === 0) context.moveTo(pt.x, pt.y);
                    else context.lineTo(pt.x, pt.y);
                  }
                }
                context.stroke();
              }
            }
          }
        ],
        labelRules: [
          {
            dataLayer: "places",
            symbolizer: new CenteredTextSymbolizer({
              labelProps: ["name"],
              fill: theme.palette.mode === 'dark' ? "#ffffff" : "#000000",
              font: "bold 14px Arial", // Larger font for Australian cities
              stroke: theme.palette.mode === 'dark' ? "#000000" : "#FFFFFF",
              width: 3
            })
          },
          {
            dataLayer: "pois", 
            symbolizer: new CenteredTextSymbolizer({
              labelProps: ["name"],
              fill: theme.palette.mode === 'dark' ? "#cccccc" : "#333333",
              font: "11px Arial",
              stroke: theme.palette.mode === 'dark' ? "#000000" : "#FFFFFF",
              width: 2
            })
          }
        ]
      });
      
      const selectedMapName = availableOfflineMaps.find(m => m.id === selectedOfflineMap)?.name || 'PMTiles';
      console.log(`✅ Created protomaps leaflet layer for ${selectedMapName}`);
      
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
                ctx.fillStyle = '#f8f9fa';
              } else if (intensity > 0.4) {
                ctx.fillStyle = '#e9ecef';
              } else if (intensity > 0.1) {
                ctx.fillStyle = '#e3f2fd';
              } else {
                ctx.fillStyle = '#bbdefb';
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
  }, [theme.palette.mode, isSatellite, satelliteProvider, isOfflineMode, offlineMapAvailable, selectedOfflineMap]);

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
      
      <MapSideBar
        nodes={markers}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
        isVisible={isSidebarVisible}
        onToggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      <Paper
        elevation={3}
        style={{
          position: 'absolute',
          top: 20,
          right: isSidebarVisible ? (isSidebarCollapsed ? 100 : 360) : 20,
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
          
          {/* Offline Map Selector - only show in offline mode when multiple maps available */}
          {isOfflineMode && availableOfflineMaps.length > 1 && (
            <FormControl size="small" variant="outlined">
              <InputLabel 
                sx={{ 
                  color: colors.text.secondary,
                  '&.Mui-focused': { color: colors.primary.main }
                }}
              >
                Region
              </InputLabel>
              <Select
                value={selectedOfflineMap}
                onChange={(e) => switchOfflineMap(e.target.value)}
                label="Region"
                sx={{
                  minWidth: 150,
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
                {availableOfflineMaps.map((mapInfo) => (
                  <MenuItem key={mapInfo.id} value={mapInfo.id}>
                    {mapInfo.id === 'queensland' ? '🇦🇺' : '🇸🇬'} {mapInfo.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              <span>
                {availableOfflineMaps.find(m => m.id === selectedOfflineMap)?.name || 'Offline Mode'}
              </span>
            </Box>
          )}
          
          {/* Map Legends - Offline Mode Only */}
          {isOfflineMode && (
            <Paper
              elevation={2}
              sx={{
                backgroundColor: colors.background.default,
                padding: 2,
                borderRadius: 2,
                marginTop: 1,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight="medium" color={colors.text.primary}>
                  Map Legends
                </Typography>
                <Box>
                  <ToggleButton
                    size="small"
                    value={isLegendsVisible ? 'collapse' : 'expand'}
                    onChange={() => setIsLegendsVisible(!isLegendsVisible)}
                    sx={{
                      border: `1px solid ${colors.border.main}`,
                      '&.Mui-selected': {
                        backgroundColor: colors.primary.main,
                        color: colors.background.paper,
                      },
                    }}
                  >
                    {isLegendsVisible ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ToggleButton>
                </Box>
              </Box>
              
              <Collapse in={isLegendsVisible}>
                <Divider sx={{ borderColor: colors.border.main, my: 1 }} />
                
                <List dense>
                  {/* Land */}
                  <ListItem>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        mr: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? "#1a1a1a" : "#F5F5DC",
                        border: `1px solid ${colors.border.main}`,
                      }}
                    />
                    <ListItemText 
                      primary="Land" 
                      secondary="Base terrain"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                  
                  {/* Vegetation */}
                  <ListItem>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        mr: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? "#2d4a2d" : "#90B090",
                        border: `1px solid ${colors.border.main}`,
                      }}
                    />
                    <ListItemText 
                      primary="Vegetation" 
                      secondary="Forests, parks, bushland"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                  
                  {/* Water */}
                  <ListItem>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        mr: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? "#1e3a5f" : "#4A90E2",
                        border: `1px solid ${colors.border.main}`,
                      }}
                    />
                    <ListItemText 
                      primary="Water" 
                      secondary="Rivers, lakes, ocean"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                  
                  {/* Buildings */}
                  <ListItem>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        mr: 1,
                        backgroundColor: theme.palette.mode === 'dark' ? "#3a3a3a" : "#D0D0D0",
                        border: `1px solid ${colors.border.main}`,
                      }}
                    />
                    <ListItemText 
                      primary="Buildings" 
                      secondary="Structures and facilities"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                  
                  {/* Roads */}
                  <ListItem>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 16,
                          height: 3,
                          mr: 0.5,
                          backgroundColor: theme.palette.mode === 'dark' ? "#FFD700" : "#FFA500",
                        }}
                      />
                    </Box>
                    <ListItemText 
                      primary="Major Roads" 
                      secondary="Highways and main routes"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                  
                  {/* Minor Roads */}
                  <ListItem>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 16,
                          height: 2,
                          mr: 0.5,
                          backgroundColor: theme.palette.mode === 'dark' ? "#999999" : "#666666",
                        }}
                      />
                    </Box>
                    <ListItemText 
                      primary="Local Roads" 
                      secondary="Residential and secondary roads"
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        color: colors.text.primary 
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: colors.text.secondary
                      }}
                    />
                  </ListItem>
                </List>
              </Collapse>
            </Paper>
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
