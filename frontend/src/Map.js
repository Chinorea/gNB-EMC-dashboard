import React, { useEffect, useRef } from 'react';
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
  initialCenter = [1.3362, 103.7542],
  initialZoom   = 13,
  markers = [],                // <-- e.g. [ [51.5, -0.09], [51.51, -0.1] ]
}) {
  const mapEl    = useRef(null);
  const mapRef   = useRef(null);


  useEffect(() => {
    // Only do this on first mount:
    mapRef.current = L.map(mapEl.current).setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    L.marker(initialCenter).addTo(mapRef.current).bindPopup('Node ID: ').bindTooltip(
    "Current location:",
    {
      permanent: true,    // stays visible
      direction: "top",   // can be 'top', 'bottom', 'right', 'left'
      offset: [0, -10],   // tweak tooltip position if you like
      className: "my-marker-label"
    });

    // // 3) add two static markers
    // L.marker([1.3362, 103.7432])
    //   .bindPopup('Static Marker 1')
    //   .addTo(mapRef.current);
    //
    // L.marker([1.3372, 103.7452])
    //   .bindPopup('Static Marker 2')
    //   .addTo(mapRef.current);
    //
    // L.circle([1.3372, 103.7452], {
    // color: 'red',
    // fillColor: '#f03',
    // fillOpacity: 0.5,
    // radius: 50
    // }).bindPopup('Area 1').addTo(mapRef.current);

        // add each marker from the array
    // markers.forEach(({ coords, popup, label }) => {
    //   const m = L.marker(coords).addTo(mapRef.current);
    //   if (popup) m.bindPopup(popup);
    //   if (label) {
    //     m.bindTooltip(label, {
    //       permanent: true,
    //       direction: 'top',
    //       offset: [0, -10],
    //       className: 'my-marker-label'
    //     });
    //   }
    // });

        // add each circle
    markers.forEach(({ coords, popup, label }) => {
      const circle = L.circle(coords, {
        radius:     50,          // 50 meters
        color:      '#007bff',   // stroke color
        fillColor:  '#30a9de',   // fill color
        fillOpacity: 0.4,
      }).addTo(mapRef.current);

      if (popup) circle.bindPopup(popup);
      if (label) {
        circle.bindTooltip(label, {
          permanent: true,
          direction: 'top',
          offset:    [0, -10],
          className: 'my-circle-label'
        });
      }
    });




    return () => mapRef.current.remove();
  }, []);              // ← empty array!  run only once

  return <div ref={mapEl} style={{ width: '100%', height: '100%' }} />;
}