from fastapi import FastAPI
from pydantic import BaseModel
import requests
import base64

app = FastAPI()

class SketchRequest(BaseModel):
    image: str  # base64 PNG from frontend

@app.post("/generate-3d")
async def generate_3d(sketch: SketchRequest):
    # Example Gemini API call (replace with real endpoint)
    response = requests.post(
        "https://api.gemini.ai/generate-3d",
        json={"image_base64": sketch.image, "output_format": "glb"}
    )

    # Assuming Gemini returns base64 3D model
    result = response.json()
    model_base64 = result["model_base64"]
    return {"model_base64": model_base64}
