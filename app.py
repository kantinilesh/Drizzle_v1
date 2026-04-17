"""
HuggingFace Spaces Deployment - Drizzle Insurance Platform
============================================================
This file serves both the FastAPI backend and the React frontend.
Gradio handles serving the static files and proxying API requests.

Usage:
    python app.py
"""

import os
import logging
import threading
import time
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drizzle.space")

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"
API_PORT = int(os.getenv("PORT", "7860"))

app = FastAPI(title="Drizzle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

subprocess_port = API_PORT + 1


def run_api_server():
    """Run FastAPI server as subprocess."""
    os.environ["DATABASE_URL"] = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./drizzle_local.db"
    )
    os.environ["PORT"] = str(subprocess_port)
    os.environ["PYTHONUNBUFFERED"] = "1"
    
    config = uvicorn.Config(
        "app.main:app",
        host="127.0.0.1",
        port=subprocess_port,
        log_level="info",
        access_log=False,
    )
    server = uvicorn.Server(config)
    server.run()


api_thread = threading.Thread(target=run_api_server, daemon=True, name="FastAPI")
api_thread.start()
time.sleep(3)
logger.info(f"Started API server on port {subprocess_port}")


@app.get("/api/{path:path}")
async def proxy_api(path: str, request: Request):
    """Proxy API requests to FastAPI backend."""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            url = f"http://127.0.0.1:{subprocess_port}/{path}"
            headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
            
            if request.method == "GET":
                resp = await client.get(url, headers=headers)
            elif request.method == "POST":
                body = await request.body()
                resp = await client.post(url, headers=headers, content=body)
            elif request.method == "PUT":
                body = await request.body()
                resp = await client.put(url, headers=headers, content=body)
            elif request.method == "DELETE":
                resp = await client.delete(url, headers=headers)
            else:
                return JSONResponse({"error": "Method not supported"}, status_code=405)
            
            return StreamingResponse(
                resp.aiter_bytes(),
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        return JSONResponse({"error": "Backend unavailable", "detail": str(e)}, status_code=503)


@app.get("/{path:path}")
async def serve_frontend(path: str):
    """Serve frontend static files."""
    if path.startswith("api/"):
        return JSONResponse({"error": "Not found"}, status_code=404)
    
    file_path = FRONTEND_DIST / path
    if file_path.is_file():
        return FileResponse(file_path)
    
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    
    return JSONResponse({"error": "Not found"}, status_code=404)


@app.get("/")
async def root():
    """Redirect to frontend."""
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse({"message": "Drizzle API running - frontend not built"})


if __name__ == "__main__":
    import gradio as gr
    
    gr.mount_gradio_app(
        target_app=app,
        routes=[],
        path="/",
    ).launch(server_name="0.0.0.0", server_port=API_PORT)