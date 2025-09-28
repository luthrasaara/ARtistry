import os
import uuid
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from point_e.api import PointE
from point_e.models.configs import PointEModels
import torch
from PIL import Image, ImageDraw
import io, json

import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API"))  # Ensure this env variable is set
model = genai.GenerativeModel("gemini-1.5-pro")


app = FastAPI()
prompt = """
Detect all objects in this image and return a JSON array.
Each entry should have:
- name (string)
- bounding_box: [x1, y1, x2, y2] in pixel coordinates
Example:
[
  {"name": "cup", "bounding_box": [120, 80, 180, 200]},
  {"name": "table", "bounding_box": [0, 250, 400, 400]}
]
"""

# Directories for uploaded images and generated models
UPLOAD_DIR = "uploaded_images"
OUTPUT_DIR = "../frontend/public/generated_models"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize the Point-E model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PointE(PointEModels.IMAGE2MESH, device=device)

def create_3d_glb(image_bytes: bytes, glb_path: str):
    """
    Generates a 3D GLB model from the provided image bytes.
    """
    try:
        # Convert bytes to PIL Image
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Generate 3D mesh using Point-E
        mesh = model.generate_mesh(image)
        
        # Export mesh to GLB
        mesh.export(glb_path, file_type='glb')
        print(f"Generated GLB at: {glb_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating 3D model: {str(e)}")

@app.post("/image_to_ar/")
async def convert_image_to_ar(file: UploadFile = File(...)):
    """
    Endpoint to convert an uploaded image to a 3D GLB model.
    """
    # Validate file type
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG/JPG/JPEG are accepted.")
    
    # Generate unique filename for the GLB
    glb_filename = f"ar_model_{uuid.uuid4().hex}.glb"
    glb_path = os.path.join(OUTPUT_DIR, glb_filename)
    
    # Read image data
    image_data = await file.read()
    
    # Create 3D GLB model
    create_3d_glb(image_data, glb_path)
    
    # Return the GLB file as a response
    return FileResponse(glb_path, media_type='model/gltf-binary', filename=glb_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


@app.post("/detect_draw/")
async def detect_and_draw(file: UploadFile):
    image = Image.open(io.BytesIO(await file.read()))

    prompt = """
    Detect all objects in this image and return a JSON array.
    Each entry should have:
    - name (string)
    - bounding_box: [x1, y1, x2, y2] in pixel coordinates
    """

    response = model.generate_content([prompt, image])
    text = response.text

    start = text.find('[')
    end = text.rfind(']') + 1
    detections = json.loads(text[start:end])

    draw = ImageDraw.Draw(image)
    for obj in detections:
        x1, y1, x2, y2 = obj["bounding_box"]
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        draw.text((x1, y1 - 10), obj["name"], fill="red")

    output_path = "output_with_boxes.jpg"
    image.save(output_path)

    return FileResponse(output_path)