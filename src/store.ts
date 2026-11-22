export type Hazard = { id: string; label: string; score: number; lat: number; lng: number; at: number };

const KEY = 'odrinetra.hazards';

export function loadHazards(): Hazard[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

export function saveHazards(list: Hazard[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toGeoJSON(list: Hazard[]) {
  return {
    type: 'FeatureCollection',
    features: list.map(h => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
      properties: { label: h.label, score: h.score, time: new Date(h.at).toISOString() },
    })),
  };
}
