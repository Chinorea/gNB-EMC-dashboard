import { useState, useEffect, useRef } from 'react';
import { PMTiles, Protocol } from 'pmtiles';
import L from 'leaflet';
import { leafletLayer, PolygonSymbolizer, LineSymbolizer, CenteredTextSymbolizer } from 'protomaps-leaflet';

/**
 * Custom hook to handle offline map functionality
 * @param {Object} theme - The current theme
 * @returns {Object} - Offline map state and handlers
 */
export function useOfflineMaps(theme) {
  const [offlineMapAvailable, setOfflineMapAvailable] = useState(false);
  const [availableOfflineMaps, setAvailableOfflineMaps] = useState([]);
  const [selectedOfflineMap, setSelectedOfflineMap] = useState('auto');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const pmtilesRef = useRef(null);

  // Initialize offline maps on component mount
  useEffect(() => {
    const initializePMTiles = async () => {
      const offlineMaps = [
        {
          id: 'singapore',
          name: 'Singapore',
          url: './offline-maps/singapore.pmtiles',
          bounds: { north: 1.5, south: 1.2, east: 104.1, west: 103.6 },
          center: [1.3521, 103.8198],
          zoom: 18
        },
        {
          id: 'queensland',
          name: 'Queensland, Australia',
          url: './offline-maps/queensland.pmtiles',
          bounds: { north: -10.4, south: -29.2, east: 153.6, west: 138.0 },
          center: [-23.3781, 150.5144],
          zoom: 6
        },
        {
          id: 'shoalwater_bay',
          name: 'Shoalwater Bay Area, Australia',
          url: './offline-maps/shoalwater_bay_area.pmtiles',
          bounds: { north: -22.0, south: -23.0, east: 150.5, west: 149.5 },
          center: [-22.5, 150.3],
          zoom: 12
        },
        {
          id: 'shoalwater_bay_satellite',
          name: 'Shoalwater Bay Satellite',
          url: './offline-maps/shoalwater_bay_satellite.pmtiles',
          bounds: { north: -22.086, south: -22.958, east: 150.853, west: 149.832 },
          center: [-22.522, 150.3],
          zoom: 13,
          type: 'satellite'
        }
      ];

      // Check which maps are available
      const availableMaps = await Promise.all(
        offlineMaps.map(async (mapConfig) => {
          try {
            const response = await fetch(mapConfig.url, { method: 'HEAD' });
            if (response.ok) {
              const pmtiles = new PMTiles(mapConfig.url);
              try {
                const header = await pmtiles.getHeader();
                return {
                  ...mapConfig,
                  pmtiles,
                  header,
                  size: response.headers.get('content-length') || 'Unknown'
                };
              } catch (error) {
                return null;
              }
            }
          } catch (error) {
            return null;
          }
          return null;
        })
      ).then(results => results.filter(Boolean));

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
      }
    };
    
    initializePMTiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Switch to a different offline map
   */
  const switchOfflineMap = (mapId, mapRef) => {
    const selectedMap = availableOfflineMaps.find(map => map.id === mapId);
    if (selectedMap && mapRef) {
      // Before switching, remove current protocol if exists
      if (pmtilesRef.current && window.pmtilesProtocol) {
        try {
          window.pmtilesProtocol.remove(pmtilesRef.current);
        } catch (e) {
          console.warn("Could not remove previous PMTiles instance", e);
        }
      }
      
      // Set new PMTiles reference
      pmtilesRef.current = selectedMap.pmtiles;
      setSelectedOfflineMap(mapId);
      
      // Add to protocol
      if (window.pmtilesProtocol) {
        window.pmtilesProtocol.add(pmtilesRef.current);
      }
      
      // Update map view
      mapRef.setView(selectedMap.center, selectedMap.zoom);
    }
  };

  /**
   * Create a PMTiles layer for Leaflet
   */
  const createPMTilesLayer = () => {
    if (!pmtilesRef.current) return null;
    
    // Check if the current selected map is a satellite map
    const currentMap = availableOfflineMaps.find(map => map.id === selectedOfflineMap);
    const isSatelliteMap = currentMap?.type === 'satellite';
    
    if (isSatelliteMap) {
      // For satellite maps, use a custom tile layer that directly renders JPEG images
      return createSatelliteTileLayer(pmtilesRef.current);
    }
    
    try {
      return leafletLayer({
        url: pmtilesRef.current,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
        maxZoom: 15,
        paintRules: createOfflineMapPaintRules(theme),
        labelRules: createOfflineMapLabelRules(theme)
      });
    } catch (error) {
      // Create fallback layer if standard PMTiles layer fails
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
              const intensity = Math.min((result.data.byteLength || 0) / 20000, 1);
              
              ctx.fillStyle = intensity > 0.7 ? '#f8f9fa' : 
                             intensity > 0.4 ? '#e9ecef' : 
                             intensity > 0.1 ? '#e3f2fd' : '#bbdefb';
              ctx.fillRect(0, 0, 256, 256);
              
              // Add detail lines based on intensity
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
              ctx.strokeRect(0, 0, 256, 256);
            } else {
              // Empty tile
              ctx.fillStyle = '#81c784';
              ctx.fillRect(0, 0, 256, 256);
            }
            
            done(null, canvas);
          })
          .catch(() => {
            // Error tile
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcdd2';
            ctx.fillRect(0, 0, 256, 256);
            done(null, canvas);
          });
        
        return canvas;
      };
      
      return fallbackLayer;
    }
  };

  /**
   * Create a specialized tile layer for satellite imagery
   */
  const createSatelliteTileLayer = (pmtiles) => {
    const tileLayer = L.tileLayer('', {
      attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
      maxZoom: 18,
    });
    
    tileLayer.createTile = function(coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.width = 256;
      tile.height = 256;
      
      pmtiles.getZxy(coords.z, coords.x, coords.y)
        .then(result => {
          if (result && result.data) {
            // For JPG tiles, create a blob URL directly
            const blob = new Blob([result.data], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            
            tile.onload = () => {
              // Clean up the blob URL after image loads
              URL.revokeObjectURL(url);
              done(null, tile);
            };
            
            tile.onerror = () => {
              URL.revokeObjectURL(url);
              done(null, createFallbackTile());
            };
            
            tile.src = url;
          } else {
            done(null, createFallbackTile());
          }
        })
        .catch(() => {
          done(null, createFallbackTile());
        });
      
      return tile;
    };
    
    return tileLayer;
  };
  
  /**
   * Create a fallback tile for when imagery isn't available
   */
  const createFallbackTile = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = theme.palette.mode === 'dark' ? '#2d3436' : '#dfe6e9';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw a simple pattern to indicate missing tile
    ctx.strokeStyle = theme.palette.mode === 'dark' ? '#636e72' : '#b2bec3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(256, 256);
    ctx.moveTo(256, 0);
    ctx.lineTo(0, 256);
    ctx.stroke();
    
    return canvas;
  };

  return {
    offlineMapAvailable,
    availableOfflineMaps,
    selectedOfflineMap,
    isOfflineMode,
    setIsOfflineMode,
    switchOfflineMap,
    createPMTilesLayer,
    pmtilesRef
  };
}

// Helper function to create paths for canvas drawing
function createPolygonPath(context, geom) {
  for (const poly of geom) {
    for (let p = 0; p < poly.length - 1; p++) {
      const pt = poly[p];
      if (p === 0) context.moveTo(pt.x, pt.y);
      else context.lineTo(pt.x, pt.y);
    }
  }
}

/**
 * Create paint rules for the offline map
 */
export function createOfflineMapPaintRules(theme) {
  const isDark = theme.palette.mode === 'dark';
  
  return [
    // Land layers
    {
      dataLayer: "earth", 
      symbolizer: new PolygonSymbolizer({
        fill: isDark ? "#1a1a1a" : "#F5F5DC",
        opacity: 1.0
      })
    },
    {
      dataLayer: "land", 
      symbolizer: new PolygonSymbolizer({
        fill: isDark ? "#1a1a1a" : "#F5F5DC",
        opacity: 1.0
      })
    },
    {
      dataLayer: "natural", 
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.natural || feature.props?.class;
          
          // Land detection
          const landTypes = ['land', 'earth', 'continent', 'island', 'ground'];
          const isLand = landTypes.some(type => 
            kind && kind.toLowerCase().includes(type.toLowerCase())
          );
          
          if (isLand || !kind) {
            context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
            context.globalAlpha = 1.0;
            context.beginPath();
            createPolygonPath(context, geom);
            context.fill();
          }
        }
      }
    },
    {
      dataLayer: "physical",
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.class;
          
          if (!kind || kind === 'land' || kind === 'continent') {
            context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
            context.globalAlpha = 1.0;
            context.beginPath();
            createPolygonPath(context, geom);
            context.fill();
          }
        }
      }
    },
    // Catch-all for polygons
    {
      dataLayer: "*",
      symbolizer: {
        draw: function(context, geom, z, feature) {
          if (geom[0] && geom[0].length > 3) {
            const props = feature.props || {};
            const isWater = props.natural === 'water' || props.landuse === 'water' || 
                          props.kind === 'water' || props.class === 'water' ||
                          props.natural === 'bay' || props.natural === 'sea' ||
                          props.natural === 'ocean' || props.natural === 'lake' ||
                          props.natural === 'river';
            
            if (!isWater) {
              context.fillStyle = isDark ? "#1a1a1a" : "#F5F5DC";
              context.globalAlpha = 0.3;
              context.beginPath();
              createPolygonPath(context, geom);
              context.fill();
            }
          }
        }
      }
    },
    
    // Vegetation and land use
    {
      dataLayer: "landcover",
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.landcover || feature.props?.class;
          
          const vegetationTypes = [
            'forest', 'wood', 'woods', 'scrub', 'grass', 'grassland',
            'heath', 'shrubland', 'bushland', 'woodland', 'trees'
          ];
          
          const isVegetation = vegetationTypes.some(type => 
            kind && kind.toLowerCase().includes(type.toLowerCase())
          );
          
          if (isVegetation) {
            context.fillStyle = isDark ? "#2d4a2d" : "#90B090";
            context.globalAlpha = 0.8;
            context.beginPath();
            createPolygonPath(context, geom);
            context.fill();
          }
        }
      }
    },
    {
      dataLayer: "landuse",
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.landuse || feature.props?.class;
          
          const greenTypes = [
            'park', 'forest', 'recreation_ground', 'recreation', 'green', 'grass',
            'garden', 'cemetery', 'golf_course', 'nature_reserve', 'wood', 'woods',
            'meadow', 'farmland', 'farm', 'allotments', 'orchard', 'vineyard',
            'scrub', 'heath', 'wetland', 'conservation', 'protected_area',
            'national_park', 'village_green', 'common', 'playground',
            'bushland', 'pastoral', 'grazing', 'station', 'outback'
          ];
          
          const urbanTypes = [
            'residential', 'commercial', 'industrial', 'retail', 'office',
            'institutional', 'educational', 'hospital', 'parking'
          ];
          
          let fillColor, alpha;
          
          if (greenTypes.some(type => kind && kind.toLowerCase().includes(type.toLowerCase()))) {
            fillColor = isDark ? "#2d4a2d" : "#90B090";
            alpha = 0.7;
          } else if (urbanTypes.some(type => kind && kind.toLowerCase().includes(type.toLowerCase()))) {
            fillColor = isDark ? "#3a3a3a" : "#E8E8E8";
            alpha = 0.6;
          } else if (kind) {
            fillColor = isDark ? "#2a2a2a" : "#F0F0F0";
            alpha = 0.5;
          } else {
            return;
          }
          
          context.fillStyle = fillColor;
          context.globalAlpha = alpha;
          context.beginPath();
          createPolygonPath(context, geom);
          context.fill();
        }
      }
    },
    
    // Water features
    {
      dataLayer: "water",
      symbolizer: new PolygonSymbolizer({
        fill: isDark ? "#162c46" : "#7bafd4",
        opacity: 1.0
      })
    },
    {
      dataLayer: "waterway",
      symbolizer: new LineSymbolizer({
        color: isDark ? "#162c46" : "#7bafd4",
        width: 2
      })
    },
    
    // Buildings
    {
      dataLayer: "buildings",
      symbolizer: new PolygonSymbolizer({
        fill: isDark ? "#3a3a3a" : "#D0D0D0",
        stroke: isDark ? "#555555" : "#BDBDBD",
        width: 0.5,
        opacity: 0.8
      })
    },
    
    // Roads
    {
      dataLayer: "roads",
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.highway || feature.props?.class;
          
          let color, width;
          
          if (kind === 'highway' || kind === 'motorway') {
            color = isDark ? "#FF8C00" : "#FF6B00";
            width = 4;
          } else if (kind === 'primary' || kind === 'trunk') {
            color = isDark ? "#FFD700" : "#FFA500";
            width = 3;
          } else if (kind === 'secondary') {
            color = isDark ? "#87CEEB" : "#4682B4";
            width = 2;
          } else if (kind === 'tertiary' || kind === 'residential') {
            color = isDark ? "#999999" : "#666666";
            width = 1.5;
          } else {
            color = isDark ? "#666666" : "#757575";
            width = 1;
          }
          
          context.strokeStyle = color;
          context.lineWidth = width;
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.beginPath();
          
          for (const line of geom) {
            for (let p = 0; p < line.length; p++) {
              const pt = line[p];
              if (p === 0) context.moveTo(pt.x, pt.y);
              else context.lineTo(pt.x, pt.y);
            }
          }
          
          context.stroke();
        }
      }
    },
    
    // Boundaries
    {
      dataLayer: "boundaries", 
      symbolizer: {
        draw: function(context, geom, z, feature) {
          const kind = feature.props?.kind || feature.props?.admin_level || feature.props?.class;
          
          let color, width;
          
          if (kind === 'state' || kind === 'territory' || feature.props?.admin_level === '4') {
            color = isDark ? "#FF69B4" : "#D2691E";
            width = 2;
          } else if (kind === 'local' || feature.props?.admin_level === '6') {
            color = isDark ? "#87CEEB" : "#708090";
            width = 1;
          } else {
            color = isDark ? "#777777" : "#9E9E9E";
            width = 1;
          }
          
          context.strokeStyle = color;
          context.lineWidth = width;
          context.globalAlpha = 0.7;
          context.beginPath();
          
          for (const line of geom) {
            for (let p = 0; p < line.length; p++) {
              const pt = line[p];
              if (p === 0) context.moveTo(pt.x, pt.y);
              else context.lineTo(pt.x, pt.y);
            }
          }
          
          context.stroke();
        }
      }
    }
  ];
}

/**
 * Create label rules for the offline map
 */
export function createOfflineMapLabelRules(theme) {
  const isDark = theme.palette.mode === 'dark';
  
  return [
    {
      dataLayer: "places",
      symbolizer: new CenteredTextSymbolizer({
        labelProps: ["name"],
        fill: isDark ? "#ffffff" : "#000000",
        font: "bold 14px Arial",
        stroke: isDark ? "#000000" : "#FFFFFF",
        width: 3
      })
    },
    {
      dataLayer: "pois", 
      symbolizer: new CenteredTextSymbolizer({
        labelProps: ["name"],
        fill: isDark ? "#cccccc" : "#333333",
        font: "11px Arial",
        stroke: isDark ? "#000000" : "#FFFFFF",
        width: 2
      })
    }
  ];
}