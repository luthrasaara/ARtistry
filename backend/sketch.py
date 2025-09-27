import os
import shutil
import uuid
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
import trimesh
from fastapi.middleware.cors import CORSMiddleware


# --- Configuration and Initialization ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_images"
OUTPUT_DIR = "generated_models"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def create_textured_glb(image_bytes: bytes, glb_path: str):
    """
    Creates a simple 3D plane mesh and textures it with the input image.
    Exports the result directly to a GLB file.
    """
    # 1. Load the image from bytes using PIL
    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception:
        raise ValueError("Invalid image file format.")

    # 2. Convert to square texture (Trimesh preference)
    # Get max dimension for square scaling
    max_dim = max(image.width, image.height)
    
    # Create a simple square mesh (a quad)
    # The dimensions are set to be AR-friendly (e.g., 1 unit in size)
    mesh = trimesh.creation.box(extents=[1.0, 1.0, 0.01]) # A very thin box = a plane

    # 3. Apply the image as a texture
    # Create the Trimesh texture visualization object
    material = trimesh.visual.TextureVisuals(image=image)
    mesh.visual = material
    
    # Optional: Rotate the mesh so it's upright when viewed in AR (e.g., on a floor)
    # This assumes the AR viewer expects Z-up or Y-up and might need adjustment 
    # based on your specific AR front-end (e.g., A-Frame, USDZ viewer).
    # mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2, [1, 0, 0]))

    # 4. Export the mesh to GLB
    # Trimesh handles embedding the image texture into the binary GLB blob.
    mesh.export(glb_path, file_type='glb')
    
    print(f"Generated GLB at: {glb_path} (Size: {os.path.getsize(glb_path)/1024:.2f} KB)")


# --- API Endpoint ---

@app.post("/image_to_ar/")
async def convert_image_to_ar(file: UploadFile = File(...)):
    # 1. Basic validation and unique naming
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.jpg', '.jpeg', '.png']:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG/PNG accepted.")

    # Generate a unique filename for the output GLB
    unique_id = uuid.uuid4().hex
    glb_filename = f"ar_model_{unique_id}.glb"
    glb_path = os.path.join(OUTPUT_DIR, glb_filename)
    
    # Read file content into memory buffer (safer and cleaner than saving to disk first)
    image_data = await file.read()

    # 2. Generate 3D Model and Export
    try:
        # Pass image data directly to the conversion function
        create_textured_glb(image_data, glb_path)
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Image error: {ve}")
    except Exception as e:
        print(f"3D Generation Error: {e}")
        # Clean up if an incomplete GLB was created
        if os.path.exists(glb_path):
            os.remove(glb_path)
        raise HTTPException(status_code=500, detail=f"3D generation failed: Internal Server Error.")

    # 3. Return the GLB file to the client
    # FastAPI automatically handles the cleanup of the file object after sending the response.
    return FileResponse(
        glb_path, 
        media_type='model/gltf-binary', 
        filename=glb_filename
    )

if __name__ == "__main__":
    print("Backend ready. Use 'uvicorn fast_ar_server:app --reload' to start the server.")
    # To run: uvicorn fast_ar_server:app --reload