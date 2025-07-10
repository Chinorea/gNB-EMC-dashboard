/**
 * Map utility functions
 */

// Tile provider URLs
const SATELLITE_PROVIDERS = {
  google: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  googleHybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  esriHybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Attribution texts
const ATTRIBUTIONS = {
  google: '© Google',
  googleHybrid: '© Google',
  esri: '© <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  esriHybrid: '© <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  stadia: '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

/**
 * Get tile URL based on current settings
 */
export function getTileUrl(isDark, satelliteMode, provider = 'esri') {
  if (satelliteMode) {
    return SATELLITE_PROVIDERS[provider] || SATELLITE_PROVIDERS.esri;
  }
  
  return isDark 
    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
    : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
}

/**
 * Get the attribution text for the map
 */
export function getAttribution(satelliteMode, provider = 'esri') {
  if (satelliteMode) {
    return ATTRIBUTIONS[provider] || ATTRIBUTIONS.esri;
  }
  return ATTRIBUTIONS.stadia;
}

/**
 * Convert signal quality to a color for link visualization
 */
export function qualityToColor(q) {
  const min = -10, max = 30;
  const clamped = Math.max(min, Math.min(max, q));
  const pct = (clamped - min) / (max - min); 
  const hue = pct * 120; // 0=red, 120=green
  return `hsl(${hue},100%,50%)`;
}

/**
 * Convert transmit power to circle radius
 */
export function txPowerToRadius(txPower) {
  if (txPower === null || txPower === undefined || isNaN(parseFloat(txPower))) {
    return 3; // Default radius when txPower is not available
  }
  
  const power = parseFloat(txPower);
  const minPower = -1;
  const maxPower = 3;
  const minRadius = 6;
  const maxRadius = 18;
  
  const clampedPower = Math.max(minPower, Math.min(maxPower, power));
  const normalizedPower = (clampedPower - minPower) / (maxPower - minPower);
  
  return Math.round(minRadius + (normalizedPower * (maxRadius - minRadius)));
}

/**
 * Get status-based colors for node markers
 */
export function getStatusColors(nodeStatus, sourceColors) {
  if (!nodeStatus) {
    return {
      color: sourceColors.nodeStatus.disconnected,
      fillColor: sourceColors.nodeStatus.disconnected
    };
  }

  const statusMap = {
    'RUNNING': sourceColors.nodeStatus.running,
    'INITIALIZING': sourceColors.nodeStatus.initializing,
    'OFF': sourceColors.nodeStatus.off,
    'DISCONNECTED': sourceColors.nodeStatus.disconnected,
    'UNREACHABLE': sourceColors.nodeStatus.unreachable
  };

  const statusColor = statusMap[nodeStatus] || sourceColors.nodeStatus.disconnected;
  
  return {
    color: statusColor,
    fillColor: statusColor
  };
}