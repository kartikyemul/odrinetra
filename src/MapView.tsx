import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hazard } from './store';

export default function MapView({ hazards }: { hazards: Hazard[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef(L.layerGroup());

  useEffect(() => {
    map.current = L.map(el.current!).setView([20.5, 78.9], 4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map.current);
    layer.current.addTo(map.current);
    return () => { map.current?.remove(); };
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    hazards.forEach(h =>
      L.circleMarker([h.lat, h.lng], { radius: 8, color: '#232326', weight: 2, fillColor: '#f6c915', fillOpacity: 1 })
        .bindPopup(`${h.label}, ${Math.round(h.score * 100)}%`)
        .addTo(layer.current));
    if (hazards.length) map.current?.setView([hazards[0].lat, hazards[0].lng], 16);
  }, [hazards]);

  return <div ref={el} className="map" />;
}
