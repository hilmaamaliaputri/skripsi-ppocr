"""FastAPI Backend Server Entrypoint untuk Sistem Verifikasi OCR Timbangan."""

import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api import runtime  # noqa: E402
from src.api.routes_eval import router as evaluation_router  # noqa: E402
from src.api.routes_inference import router as inference_router  # noqa: E402

# Re-export untuk kompatibilitas pengujian dan pemanggil eksternal
BASE_DIR = runtime.BASE_DIR
CONFIG_DIR = runtime.CONFIG_DIR
PRODUCT_CONFIGS = runtime.PRODUCT_CONFIGS
DEVICE_CONFIGS = runtime.DEVICE_CONFIGS
CALIBRATION_PARAMS = runtime.CALIBRATION_PARAMS
audit_logger = runtime.audit_logger
get_recognizer = runtime.get_recognizer

app = FastAPI(
    title="Scale OCR Verification System API",
    version="1.0.0",
    description="Backend API untuk Komparasi & Verifikasi OCR 7-Segmen Berbasis PP-OCRv6",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
DATASET_ROOT = os.path.join(REPO_ROOT, "dataset")

# Mount spesifik terlebih dahulu agar NTFS junction di sistem/data/ tidak terblokir Starlette realpath check
for route_sub, folder_name in (
    ("synthetic", "04_uji_burst_120"),
    ("calib", "02_kalibrasi"),
    ("dataset_uji", "03_uji_755"),
    ("dataset_latih", "01_latih"),
):
    target_dir = os.path.join(DATASET_ROOT, folder_name)
    if os.path.exists(target_dir):
        app.mount(f"/data/{route_sub}", StaticFiles(directory=target_dir), name=f"data_{route_sub}")

data_dir = os.path.join(BASE_DIR, "data")
if os.path.exists(data_dir):
    app.mount("/data", StaticFiles(directory=data_dir), name="data")

app.include_router(inference_router)
app.include_router(evaluation_router)

operator_dist = os.path.abspath(os.path.join(BASE_DIR, "frontend", "operator", "dist"))
evaluator_dist = os.path.abspath(os.path.join(BASE_DIR, "frontend", "evaluator", "dist"))

if os.path.exists(os.path.join(operator_dist, "assets")):
    app.mount("/operator/assets", StaticFiles(directory=os.path.join(operator_dist, "assets")), name="operator_assets")

if os.path.exists(os.path.join(evaluator_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(evaluator_dist, "assets")), name="evaluator_assets")


@app.get("/operator")
def redirect_operator_slash():
    return RedirectResponse(url="/operator/", headers={"Cache-Control": "no-store"})


@app.get("/operator/")
def serve_operator():
    return FileResponse(os.path.join(operator_dist, "index.html"), headers={"Cache-Control": "no-store"})


@app.get("/")
def serve_evaluator():
    return FileResponse(os.path.join(evaluator_dist, "index.html"), headers={"Cache-Control": "no-store"})


@app.get("/favicon.svg")
def serve_favicon():
    p = os.path.join(evaluator_dist, "favicon.svg")
    if os.path.exists(p):
        return FileResponse(p)
    raise HTTPException(status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
