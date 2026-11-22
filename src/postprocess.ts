export type Box = { x: number; y: number; w: number; h: number; score: number; cls: number };

export function iou(a: Box, b: Box) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union ? inter / union : 0;
}

export function nms(boxes: Box[], limit = 0.45) {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: Box[] = [];
  for (const b of sorted) {
    if (kept.every(k => k.cls !== b.cls || iou(k, b) < limit)) kept.push(b);
  }
  return kept;
}

// YOLOv8 output is [1, 4 + classes, anchors], flattened row by row
export function decode(data: Float32Array, nc: number, minScore: number): Box[] {
  const n = data.length / (4 + nc);
  const out: Box[] = [];
  for (let i = 0; i < n; i++) {
    let best = 0, cls = 0;
    for (let c = 0; c < nc; c++) {
      const s = data[(4 + c) * n + i];
      if (s > best) { best = s; cls = c; }
    }
    if (best < minScore) continue;
    const w = data[2 * n + i], h = data[3 * n + i];
    out.push({ x: data[i] - w / 2, y: data[n + i] - h / 2, w, h, score: best, cls });
  }
  return out;
}
