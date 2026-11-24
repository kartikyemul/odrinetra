import argparse
import json
from pathlib import Path

from ultralytics import YOLO

parser = argparse.ArgumentParser()
parser.add_argument("--data", default="ml/data.yaml")
parser.add_argument("--epochs", type=int, default=60)
parser.add_argument("--batch", type=int, default=16)
parser.add_argument("--name", default="run")
args = parser.parse_args()

model = YOLO("yolov8n.pt")
model.train(data=args.data, epochs=args.epochs, imgsz=640, batch=args.batch, project="runs", name=args.name)

metrics = model.val()
result = {
    "map50": round(float(metrics.box.map50), 3),
    "map50_95": round(float(metrics.box.map), 3),
    "classes": list(model.names.values()),
}
Path("runs").mkdir(exist_ok=True)
Path("runs/metrics.json").write_text(json.dumps(result, indent=2))
print(result)

model.export(format="onnx", imgsz=640, opset=12, simplify=True)
