import os
import uuid
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

app = FastAPI()

HF_API_KEY = os.getenv("HF_API_KEY", "hf_your_real_key_here")
HF_MODEL = "stabilityai/stable-fast-3d"

@app.post("/image_to_ar/")
async def convert_image_to_ar(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG/JPG/JPEG are accepted.")
    
    glb_filename = f"ar_model_{uuid.uuid4().hex}.glb"
    glb_path = os.path.join("generated_models", glb_filename)
    os.makedirs("generated_models", exist_ok=True)

    # Read image data
    image_data = await file.read()

    # Hugging Face API call
    API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    files = {"file": image_data}

    response = requests.post(API_URL, headers=headers, files=files)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Hugging Face error: {response.text}")

    with open(glb_path, "wb") as f:
        f.write(response.content)

    return FileResponse(glb_path, media_type='model/gltf-binary', filename=glb_filename)
