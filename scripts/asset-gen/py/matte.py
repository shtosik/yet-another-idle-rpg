"""Background matting for generated art: writes an 8-bit alpha mask PNG for each input image.

Usage: python matte.py <model.onnx> <in1.png> <out1.png> [<in2.png> <out2.png> ...]

Runs the ISNet general-use ONNX model (same family rembg uses) with onnxruntime, which is already installed in the
ComfyUI venv. Several images per call share one model load. The mask is left soft; the caller thresholds it.
"""

import sys

import numpy as np
import onnxruntime as ort
from PIL import Image

SIZE = 1024
MEAN = np.array([0.5, 0.5, 0.5], dtype=np.float32)
STD = np.array([1.0, 1.0, 1.0], dtype=np.float32)


def matte(session, src: str, dst: str) -> None:
    image = Image.open(src).convert("RGB")
    resized = np.asarray(image.resize((SIZE, SIZE), Image.LANCZOS), dtype=np.float32) / 255.0
    resized = (resized - MEAN) / STD
    batch = resized.transpose(2, 0, 1)[None, ...].astype(np.float32)
    out = session.run(None, {session.get_inputs()[0].name: batch})[0][0, 0]
    out = (out - out.min()) / max(out.max() - out.min(), 1e-6)
    mask = Image.fromarray((out * 255).astype(np.uint8)).resize(image.size, Image.LANCZOS)
    mask.save(dst)


def main() -> None:
    model, pairs = sys.argv[1], sys.argv[2:]
    if len(pairs) % 2:
        sys.exit("expected <in> <out> pairs")
    providers = [p for p in ("CUDAExecutionProvider", "CPUExecutionProvider") if p in ort.get_available_providers()]
    session = ort.InferenceSession(model, providers=providers)
    for src, dst in zip(pairs[0::2], pairs[1::2]):
        matte(session, src, dst)


if __name__ == "__main__":
    main()
