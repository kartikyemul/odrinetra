import { describe, expect, it } from 'vitest';
import { decode, iou, nms } from './postprocess';

const box = (x: number, score: number, cls = 0) => ({ x, y: 0, w: 10, h: 10, score, cls });

describe('postprocess', () => {
  it('iou is 1 for identical boxes and 0 for distant ones', () => {
    expect(iou(box(0, 1), box(0, 1))).toBe(1);
    expect(iou(box(0, 1), box(50, 1))).toBe(0);
  });
  it('nms drops the weaker of two overlapping boxes of one class', () => {
    const kept = nms([box(0, 0.6), box(1, 0.9)]);
    expect(kept).toHaveLength(1);
    expect(kept[0].score).toBe(0.9);
  });
  it('nms keeps overlapping boxes of different classes', () => {
    expect(nms([box(0, 0.6, 0), box(1, 0.9, 1)])).toHaveLength(2);
  });
  it('decode reads one anchor laid out as cx, cy, w, h, scores', () => {
    const data = new Float32Array([20, 30, 10, 8, 0.1, 0.8]);
    const [b] = decode(data, 2, 0.5);
    expect(b).toMatchObject({ x: 15, y: 26, w: 10, h: 8, cls: 1 });
  });
});
