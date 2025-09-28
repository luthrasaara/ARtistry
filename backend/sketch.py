import os
import io
import json
import base64
import subprocess
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from PIL import Image

import google.generativeai as genai

# --- Gemini API Configuration ---
api_key = os.getenv("GEMINI_API")
if not api_key:
    # Use a dummy key if running locally without the environment variable set
    print("WARNING: GEMINI_API environment variable not set.")
    # This prevents the script from crashing on genai.configure()
    genai.configure(api_key="AIzaSyD2-SGMSVY6fp4WZPLmL7v0h2ORk7Episk") 
else:
    genai.configure(api_key=api_key) 
    
model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# 1. STABLE-FAST-3D CONFIGURATION (Global Variables) - UPDATED FOR PROJECT STRUCTURE
# ---------------------------------------------------------------------

# 1. Base directory (where app.py and run.py are, e.g., project/backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 

# 2. Determine Project Root (Assuming BASE_DIR is project/backend/)
# Goes up one level (backend/) then up again (project/)
# This path is 'project/'
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir)) # Adjusted: Assuming backend is directly under project/
ROOT_DIR = os.path.abspath(os.path.join(PROJECT_DIR, os.pardir)) # Go up one more level to 'project/'
STABLE_DIR = os.path.join(ROOT_DIR, "stable-fast-3d") # 'project/stable-fast-3d'

# Note: If your structure is project/src/backend, you'd use os.path.join(BASE_DIR, os.pardir, os.pardir)

# 3. Frontend Public Folder setup (The final destination for assets: project/frontend/public/)
FRONTEND_PUBLIC_DIR = os.path.join(ROOT_DIR, "frontend", "public")
os.makedirs(FRONTEND_PUBLIC_DIR, exist_ok=True) 

# 4. Temp folders for input/output during generation
# Input is saved temporarily in the public folder before processing
TEMP_INPUT_IMAGE_FILENAME = "rose.png"
TEMP_INPUT_IMAGE_PATH = os.path.join(FRONTEND_PUBLIC_DIR, TEMP_INPUT_IMAGE_FILENAME)

# The 'run.py' script will write its temporary output here (inside the backend)
TEMP_OUTPUT_DIR = os.path.join(PROJECT_DIR,"frontend", "public", "generated_models") # 'project/backend/public/temp_3d_output/'
os.makedirs(TEMP_OUTPUT_DIR, exist_ok=True) 

# 5. Final output file name (Fixed URL for the frontend)
FIXED_GLB_FILENAME = "latest_ar_model.glb"
FIXED_GLB_PATH = os.path.join(FRONTEND_PUBLIC_DIR, FIXED_GLB_FILENAME)

# The URL the frontend will use to load the model (relative to its own root/public path)
FIXED_PUBLIC_URL = f"/{FIXED_GLB_FILENAME}" 


# ---------------------------------------------------------------------
# 2. SYNCHRONOUS GLB GENERATION (Stable-Fast-3D integration)
# ---------------------------------------------------------------------

# This MUST be a regular synchronous 'def' function.
def _sync_generate_glb(image_bytes):
    """
    1. Saves image bytes to a temp file in the public folder.
    2. Runs the 'python run.py' command using subprocess.
    3. Finds the resulting GLB and moves/renames it to the fixed public path.
    """
    
    # 1. Save the incoming image bytes to a temporary file
    try:
        with open(TEMP_INPUT_IMAGE_PATH, 'wb') as f:
            f.write(image_bytes)
    except Exception as e:
        raise Exception(f"Failed to save temporary input image: {e}")

    # 2. Construct and run the command
    command = [
        "python", 
        "run.py", 
        TEMP_INPUT_IMAGE_PATH,  # Input from the public folder
        "--output-dir", 
        TEMP_OUTPUT_DIR         # Output to the temp backend folder
    ]
    
    print(f"Starting 3D generation: {' '.join(command)}")

    try:
        # Execute the command. The check=True ensures an error is raised on failure.
        subprocess.run(
            command, 
            cwd=STABLE_DIR, # run.py is in BASE_DIR (project/backend)
            check=True, 
            timeout=1200 # 20 minutes timeout for generation
        )
    except subprocess.CalledProcessError as e:
        # Catches errors from the stable-fast-3d script itself
        raise Exception(f"3D generation script failed. Output: {e.stderr if e.stderr else e.stdout}")
    except subprocess.TimeoutExpired:
        raise Exception("3D generation timed out.")
    except Exception as e:
        raise Exception(f"Subprocess execution error: {e}")

    # 3. Find the generated GLB file
    # Stable-Fast-3D names the file based on the input image name within TEMP_OUTPUT_DIR
    base_name = os.path.splitext(TEMP_INPUT_IMAGE_FILENAME)[0] # 'temp_input_image'
    expected_glb_filename = f"{base_name}.glb" # 'temp_input_image.glb'
    temp_glb_path = os.path.join(TEMP_OUTPUT_DIR, expected_glb_filename)

    if not os.path.exists(temp_glb_path):
        # Fallback to listing files if naming convention changes
        generated_files = [f for f in os.listdir(TEMP_OUTPUT_DIR) if f.endswith('.glb')]
        if generated_files:
            temp_glb_path = os.path.join(TEMP_OUTPUT_DIR, generated_files[0])
        else:
            raise Exception("Stable-Fast-3D ran but did not generate the expected .glb file.")
    
    # 4. Move and rename the GLB to the final public path (OVERWRITING the old one)
    # Moves the GLB from TEMP_OUTPUT_DIR (backend/temp_3d_output/) to FIXED_GLB_PATH (frontend/public/latest_ar_model.glb)
    shutil.move(temp_glb_path, FIXED_GLB_PATH)
    
    # 5. Clean up temp files
    # Only remove the input image if it's no longer needed after generation
    if os.path.exists(TEMP_INPUT_IMAGE_PATH):
        os.remove(TEMP_INPUT_IMAGE_PATH)
    
    # Clean up the backend temp output directory
    for f in os.listdir(TEMP_OUTPUT_DIR):
        os.remove(os.path.join(TEMP_OUTPUT_DIR, f))

# ---------------------------------------------------------------------
# 3. ENDPOINTS
# ---------------------------------------------------------------------

@app.post("/image_to_ar/")
async def convert_image_to_ar(file: UploadFile = File(...)):
    
    # Read the file contents into 'image_bytes'
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read image file: {e}")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Received empty image file.")
    
    try:
        # Delegate the slow synchronous task to a worker thread
        await run_in_threadpool(_sync_generate_glb, image_bytes)
        
        # Final check for successful file creation
        if not os.path.exists(FIXED_GLB_PATH) or os.path.getsize(FIXED_GLB_PATH) < 100: 
             raise Exception("Generated GLB file is missing or too small.")

    except Exception as e:
        print(f"3D Generation Error: {e}")
        # Clean up on failure and raise the error for the frontend
        if os.path.exists(FIXED_GLB_PATH):
            os.remove(FIXED_GLB_PATH)
        raise HTTPException(status_code=500, detail=f"3D generation failed: {str(e)}")

    # Return the fixed public URL (Frontend will load this path)
    return JSONResponse(content={"model_url": FIXED_PUBLIC_URL})


@app.post("/detect_objects/")
async def detect_objects(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image_part = Image.open(io.BytesIO(image_bytes))

        # --- Base64 Encode the original image ---
        buffered = io.BytesIO()
        image_part.save(buffered, format="PNG")
        encoded_image_string = base64.b64encode(buffered.getvalue()).decode("utf-8")
        # ----------------------------------------

        json_prompt = """
            Detect all distinct objects in this image (this is a user drawing).
            Return a JSON array ONLY. DO NOT include any surrounding text, markdown formatting (like ```json), or commentary.
            Each entry must strictly follow this format:
            {"name": "object_name", "bounding_box": [x1, y1, x2, y2]} in pixel coordinates.
        """
        response = model.generate_content(
            contents=[json_prompt, image_part]
        )

        data_str = response.text.strip()
        
        # Clean up markdown formatting if present
        if data_str.startswith("```json"):
            data_str = data_str.replace("```json", "").replace("```", "").strip()
        
        if not data_str:
            raise ValueError("Gemini returned an empty response.")
            
        objects = json.loads(data_str) 

        # --- Return both objects and the encoded image ---
        return JSONResponse(content={
            "objects": objects,
            "image": f"data:image/png;base64,{encoded_image_string}" # Prefix for display in HTML
        })

    except Exception as e:
        print(f"Unexpected Error in detect_objects: {e}")
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {str(e)}"})

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
