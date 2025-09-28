import os
import uuid
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load .env file if exists
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_API_KEY = "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"
HF_MODEL = "stabilityai/stable-fast-3d"

if not HF_API_KEY:
    raise RuntimeError("HF_API_KEY not found. Please add it to your .env file.")

@app.post("/image_to_ar/")
async def convert_image_to_ar(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG/JPG/JPEG are accepted.")

    # Prepare paths
    glb_filename = f"ar_model_{uuid.uuid4().hex}.glb"
    glb_path = os.path.join("generated_models", glb_filename)
    os.makedirs("generated_models", exist_ok=True)

    # Read file data
    image_data = await file.read()

    # Hugging Face API call
    API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    files = {"file": ("input_image.png", image_data, "image/png")}

    response = requests.post(API_URL, headers=headers, files=files)
    print(response)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Hugging Face API error ({response.status_code}): {response.text}"
        )

    # Save returned GLB
    with open(glb_path, "wb") as f:
        f.write(response.content)

    return FileResponse(glb_path, media_type="model/gltf-binary", filename=glb_filename)


if __name__ == "__main__":
    import uvicorn
    #uvicorn.run(app, host="0.0.0.0", port=8000)
