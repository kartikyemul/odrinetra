import sys

import numpy as np
import onnxruntime as ort

path = sys.argv[1] if len(sys.argv) > 1 else "public/models/hazard.onnx"
session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
inp, out = session.get_inputs()[0], session.get_outputs()[0]
print("input", inp.name, inp.shape)
print("output", out.name, out.shape)

blank = np.zeros((1, 3, 640, 640), dtype=np.float32)
result = session.run(None, {inp.name: blank})[0]
print("classes:", result.shape[1] - 4, "anchors:", result.shape[2])
