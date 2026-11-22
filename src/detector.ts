import * as ort from 'onnxruntime-web';
import { Box, decode, nms } from './postprocess';
import { LABELS } from './labels';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';

const SIZE = 640;
let session: ort.InferenceSession | null = null;
const work = document.createElement('canvas');
work.width = work.height = SIZE;
const ctx = work.getContext('2d', { willReadFrequently: true })!;

export async function loadModel(url = '/models/hazard.onnx') {
  session = await ort.InferenceSession.create(url, { executionProviders: ['wasm'] });
}

// boxes come back in the video's own pixel space
export async function detect(video: HTMLVideoElement, minScore = 0.4): Promise<Box[]> {
  if (!session) return [];
  const scale = Math.min(SIZE / video.videoWidth, SIZE / video.videoHeight);
  const dw = video.videoWidth * scale, dh = video.videoHeight * scale;
  const px = (SIZE - dw) / 2, py = (SIZE - dh) / 2;

  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(video, px, py, dw, dh);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  const plane = SIZE * SIZE;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 4] / 255;
    input[plane + i] = data[i * 4 + 1] / 255;
    input[2 * plane + i] = data[i * 4 + 2] / 255;
  }

  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) });
  const raw = out[session.outputNames[0]].data as Float32Array;
  return nms(decode(raw, LABELS.length, minScore)).map(b => ({
    ...b, x: (b.x - px) / scale, y: (b.y - py) / scale, w: b.w / scale, h: b.h / scale,
  }));
}
