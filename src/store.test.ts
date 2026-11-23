import { describe, expect, it } from 'vitest';
import { toGeoJSON } from './store';

describe('toGeoJSON', () => {
  it('puts longitude before latitude', () => {
    const out = toGeoJSON([{ id: '1', label: 'pothole', score: 0.9, lat: 17.68, lng: 75.9, at: 0 }]);
    expect(out.features[0].geometry.coordinates).toEqual([75.9, 17.68]);
  });
  it('gives no features for an empty log', () => {
    expect(toGeoJSON([]).features).toHaveLength(0);
  });
});
