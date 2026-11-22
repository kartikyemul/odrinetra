from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(data="ml/data.yaml", epochs=60, imgsz=640, batch=16, project="runs", name="odrinetra")

metrics = model.val()
print("mAP50:", round(metrics.box.map50, 3), "mAP50-95:", round(metrics.box.map, 3))

model.export(format="onnx", imgsz=640, opset=12, simplify=True)
