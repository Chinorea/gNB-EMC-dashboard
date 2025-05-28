import React, { useEffect, useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// pull in all three images from the Leaflet package
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';
// tell Leaflet to use these instead of its hard-coded paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});


export default function MapView({
  initialCenter = [0,0],
  initialZoom   = 2,
  markers       = [],
  //linkQualityMatrix = []
}) {
  const mapEl = useRef(null);
  const map   = useRef(null);
  const layer = useRef(null);

  // initialize map once
  useEffect(() => {
    map.current = L.map(mapEl.current).setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'© OSM'
    }).addTo(map.current);
    return () => map.current.remove();
  }, []);

    // helper: map SNR (-10..+30) → color (red→green)
  function qualityToColor(q) {
    const min = -10, max = 30;
    // clamp:
    const clamped = Math.max(min, Math.min(max, q));
    const pct = (clamped - min) / (max - min);   // 0..1
    const hue = pct * 120;                       // 0=red, 120=green
    return `hsl(${hue},100%,50%)`;
  }


  // rebuild circles + polyline whenever `markers` changes
  useEffect(() => {
    if (!map.current) return;

    // clear old layer
    if (layer.current) {
      map.current.removeLayer(layer.current);
    }

    const group = L.layerGroup();
    console.log('markers', markers);
    markers.forEach(marker => {
      const lat = parseFloat(marker.latitude)  || 0;
      const lng = parseFloat(marker.longitude) || 0;

      const circle = L.circle([lat, lng], {
        radius:      10,
        color:       '#007bff',
        fillColor:   '#30a9de',
        fillOpacity: 0.4
      }).addTo(group);

      const { latitude, longitude, ...rest } = marker;

      const popupHtml = Object
        .entries(rest)
        .map(([k,v]) => `<strong>${k}</strong>: ${v}`)
        .join('<br>');
      circle.bindPopup(popupHtml);


      const label = String(marker.id || marker.label || '');
      circle.bindTooltip(label, {
        permanent: true,
        direction: 'top',
        offset:    [0, -10]
      });
    });

    if (markers.length > 1) {
      const coords = markers.map(marker => [
        parseFloat(marker.latitude)  || 0,
        parseFloat(marker.longitude) || 0
      ]);
      L.polyline(coords, {
        color:     'green',
        weight:    3,
        dashArray: '4,6'
      }).addTo(group);
    }

    group.addTo(map.current);
    layer.current = group;
  }, [markers]);


  return (
    <div
      ref={mapEl}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
