# ODRINETRA

*Greek hodos (road) + Sanskrit drishti (sight) and netra (eye): the eye of the road.*

Point a phone at the road and every pothole, open manhole or speed breaker it sees gets a GPS pin on a map.
Detection runs **in the browser** with YOLOv8 exported to ONNX. There is no backend, no account and no video upload.

## Why this exists

Road hazards are easy to hit and hard to log. ODRINETRA is a phone-first web app that runs a small detection
model on the device, tags each detection with GPS, and exports GeoJSON that GIS tools can open.

## How it works

```
camera frame -> letterbox 640x640 -> YOLOv8n (onnxruntime-web, WASM) -> decode + NMS
             -> boxes on overlay -> GPS fix attached -> local log -> map + GeoJSON
```

| Stage | What was done |
|---|---|
| Requirements | Free to run, installable, no server, usable one-handed |
| Data | A public road-hazard dataset, credited in `docs/DATA.md` |
| Model | YOLOv8n fine-tuned on a free Colab GPU, see `ml/colab_train.ipynb` |
| Evaluation | mAP from `model.val()`, reported in the model card below |
| Build | Vite, React, TypeScript, onnxruntime-web, Leaflet |
| Test | Vitest unit tests for IoU, NMS, output decoding and GeoJSON export |
| CI/CD | GitHub Actions runs tests and build, Vercel deploys on push |
| Operate | A service worker caches the app, the ONNX engine and the model after the first load |

## Run it

```bash
npm install
npm test
npm run dev
```

Use **Try a photo** to test on a laptop with no camera. The app needs a trained model at
`public/models/hazard.onnx`. Until it exists the page says "Model not found".

## Train the model

1. Pick a dataset and check its licence, see [docs/DATA.md](docs/DATA.md).
2. Open `ml/colab_train.ipynb` in Google Colab, choose a T4 GPU runtime and run the cells in order.
3. Download `hazard.onnx` and put it in `public/models/`.
4. Replace `src/labels.ts` with the `LABELS` line the notebook prints.
5. Optional check: `python ml/check_onnx.py public/models/hazard.onnx` (needs `onnxruntime` and `numpy`).
6. Copy the mAP numbers into the model card.

`ml/train.py` does the same training from a terminal if you prefer: `python ml/train.py --data path/to/data.yaml`.

## Deploy (free)

Push to GitHub, import the repo in Vercel (Hobby plan) and keep the Vite defaults. Camera and GPS need HTTPS,
which Vercel provides.

## Privacy and network requests

- Video frames and GPS fixes stay on the device. The log is kept in the browser's local storage.
- The page makes requests to Google Fonts (typeface) and OpenStreetMap (map tiles). Those services can see your IP
  address, and the tiles reveal which area of the map you are viewing.
- There are no analytics, accounts, API keys or other calls.

## Model card

| Item | Value |
|---|---|
| Base model | YOLOv8n |
| Classes | pothole, open manhole, speed breaker (replace if your dataset differs) |
| Input | 640x640 RGB |
| mAP50 | fill in after training |
| mAP50-95 | fill in after training |
| Known limits | Night, heavy rain, glare and unseen road surfaces can lower accuracy. Detections are a hint, not a survey |

## Credits and licences

App code: MIT. Training uses Ultralytics YOLOv8 (AGPL-3.0), so keep this repository public if you distribute weights.
Map data © OpenStreetMap contributors. Dataset licence depends on the dataset you choose, see `docs/DATA.md`.
