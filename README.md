# ODRINETRA

*Greek hodos (road) + Sanskrit drishti (sight) and netra (eye): the eye of the road.*

Point a phone at the road and every pothole, open manhole or speed breaker it sees gets a GPS pin on a map.
Detection runs **in the browser** with YOLOv8 exported to ONNX. There is no server, no account and no upload.
The video never leaves the device.

## Why this exists

Road damage is reported late, by hand, or not at all. Most pothole detectors on GitHub are Python notebooks or
Streamlit apps that need a server. ODRINETRA is a phone-first web app that works where signal is poor, keeps the
data on the device, and exports GeoJSON that any GIS tool or municipal portal can open.

## How it works

```
camera frame -> letterbox 640x640 -> YOLOv8n (onnxruntime-web, WASM) -> decode + NMS
             -> boxes on overlay -> GPS fix attached -> local log -> map + GeoJSON
```

| Stage | What was done |
|---|---|
| Requirements | Free to run, installable, private by default, usable one-handed on a bike or in a car |
| Data | Road-hazard images from a public dataset (see `ml/data.yaml`). Check the licence before use |
| Model | YOLOv8n fine-tuned on a free Colab/Kaggle GPU via `ml/train.py` |
| Evaluation | mAP reported by `model.val()`, see the model card below |
| Build | Vite, React, TypeScript, onnxruntime-web, Leaflet |
| Test | Vitest unit tests for IoU, NMS and output decoding |
| CI/CD | GitHub Actions runs tests and build, Vercel deploys on push |
| Operate | Service worker caches the app and model after the first load |

## Run it

```bash
npm install
npm test
npm run dev
```

The app needs a trained model at `public/models/hazard.onnx`. No weights are committed.

## Train the model

1. Download a pothole / road-hazard dataset in YOLOv8 format into `datasets/hazards` with `images/train`, `images/val` and labels.
2. Adjust the class names in `ml/data.yaml` and `src/labels.ts` so they match, in the same order.
3. `pip install ultralytics`, then `python ml/train.py`.
4. Copy `runs/odrinetra/weights/best.onnx` to `public/models/hazard.onnx`.

## Deploy (free)

Push to GitHub, import the repo in Vercel (Hobby plan), keep the Vite defaults. Camera and GPS need HTTPS,
which Vercel provides.

## Model card

| Item | Value |
|---|---|
| Base model | YOLOv8n |
| Classes | pothole, open manhole, speed breaker |
| Input | 640x640 RGB |
| mAP50 | fill in after training |
| mAP50-95 | fill in after training |
| Known limits | Night, heavy rain, glare and unseen road surfaces will lower accuracy. Detections are a hint, not a survey |

## Credits and licences

App code: MIT. Training uses Ultralytics YOLOv8 (AGPL-3.0), so keep this repository public if you distribute weights.
Map data © OpenStreetMap contributors. Dataset licence depends on the dataset you choose.
