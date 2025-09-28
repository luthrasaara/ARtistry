/*import React, { useState } from "react";
import SketchCanvas from "./components/SketchCanvas";
import ARViewer from "./components/ARViewer";

// --- Backend API Endpoints ---
const DETECT_API_URL = "http://localhost:5000/detect_draw/"; // First call: sends drawing to detect/process
const AR_GENERATE_API_URL = "http://localhost:5000/image_to_ar/"; // Second call: sends processed image to generate .glb

// --- Frontend Path for the generated .glb file ---
// The backend is expected to save the file here: public/generated_models/output.glb
const GENERATED_MODEL_PATH = "/generated_models/output.glb"; 

export default function CreatePage() {
  // State to hold the URL of the .glb model to be displayed by ARViewer
  const [modelUrl, setModelUrl] = useState(null); 
  // State to show loading status
  const [isLoading, setIsLoading] = useState(false);

  
   * Main function to handle the export from SketchCanvas and trigger the
   * two-step backend process (detect -> generate AR).
   * @param {Blob} imageBlob - The drawing data as a Blob object.
   
  const handleExport = async (imageBlob) => {
    if (!imageBlob) return;

    setIsLoading(true);
    setModelUrl(null); // Clear previous model

    try {
      // --- STEP 1: UPLOAD DRAWING FOR DETECTION/PROCESSING (/detect_draw/) ---
      
      const detectFormData = new FormData();
      // 'file' must match the name expected by the /detect_draw/ endpoint
      detectFormData.append("file", imageBlob, "user_drawing.png");

      console.log("1. Sending drawing to detection/processing endpoint...");
      
      const detectResponse = await fetch(DETECT_API_URL, {
        method: "POST",
        body: detectFormData,
      });

      if (!detectResponse.ok) {
        throw new Error(`Detection API failed: ${detectResponse.statusText}`);
      }
      
      // Assuming the backend returns a JSON with the path/URL of the processed image
      // For simplicity, we'll assume the processed image is saved on the server
      // and the backend returns a success status for the next step.
      const detectResult = await detectResponse.json();
      console.log("Detection successful. Result:", detectResult);

      // --- STEP 2: TRIGGER AR MODEL GENERATION (/image_to_ar/) ---
      
      // We need to send the PROCESSED image from step 1 to the AR generator. 
      // This implementation ASSUMES the /image_to_ar/ endpoint knows which 
      // processed image to use based on the /detect_draw/ call, OR 
      // that the /detect_draw/ call returned the processed image data. 
      
      // If /image_to_ar/ needs a direct call with the *processed* image file:
      // You would need to update the logic here to use the processed image data 
      // returned from Step 1, or rely on the backend's internal storage mechanism.

      // For this example, we'll make a simplified call to /image_to_ar/
      // assuming it can now access the file created by /detect_draw/. 
      // If your /image_to_ar/ endpoint requires the actual processed image data:
      const processedImageBlob = detectResult.processed_image_blob; // Placeholder - adjust based on your actual backend response!
      
      const generateFormData = new FormData();
      // 'file' must match the name expected by the /image_to_ar/ endpoint
      generateFormData.append("file", processedImageBlob || imageBlob, "processed_image.png");

      console.log("2. Sending processed image to AR generation endpoint...");

      const generateResponse = await fetch(AR_GENERATE_API_URL, {
        method: "POST",
        body: generateFormData,
      });

      if (!generateResponse.ok) {
        throw new Error(`AR Generation API failed: ${generateResponse.statusText}`);
      }
      
      // Assuming the backend has successfully saved the .glb to public/generated_models/
      // The API call usually returns a success message or the path to the GLB file.
      const generateResult = await generateResponse.json();
      console.log("AR Generation successful. Result:", generateResult);
      
      // --- STEP 3: UPDATE ARVIEWER WITH NEW MODEL PATH ---
      // This is the key: we tell the ARViewer where the new model is located.
      setModelUrl(GENERATED_MODEL_PATH);
      console.log("3. ARViewer updated with new model:", GENERATED_MODEL_PATH);


    } catch (error) {
      console.error("Error in AR model generation process:", error);
      setModelUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Draw and Create AR</h1>
      <hr />
      
      <h2>1. Draw</h2>

      <SketchCanvas onExport={handleExport} isLoading={isLoading} />
      
      <hr />

      <h2>2. View in AR</h2>
      {isLoading && <p>Generating 3D Model... Please wait.</p>}
      
      <ARViewer modelPath={modelUrl} />

      {!isLoading && !modelUrl && (
        <p>Export your drawing to generate and view the AR model.</p>
      )}

    </div>
  );
}*/

import React, { useEffect } from "react";
import SketchCanvas from "./components/SketchCanvas";

const BACKEND_API_URL = "http://localhost:5000/image_to_ar/"; // **Replace with your actual backend endpoint**
const IMAGE_PATH = "/rose.png"; // **Path relative to your public folder**

export default function CreatePage() {

  // Function to fetch the local image and post it to the backend
  const uploadAndGenerate = async () => {
    try {
      // 1. Fetch the image from the public folder
      const imageResponse = await fetch(IMAGE_PATH);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      // 2. Get the response body as a Blob (file-like object)
      const imageBlob = await imageResponse.blob();

      // 3. Create a FormData object to send the file to the backend
      const formData = new FormData();
      // 'sketch_file' should match the name your backend (sketch.py) expects for the file input
      formData.append("file", imageBlob, "rose.png");

      console.log("Sending image to backend for 3D generation...");
      
      // 4. Send the FormData to the backend API
      const apiResponse = await fetch(BACKEND_API_URL, {
        method: "POST",
        body: formData, // FormData sets the correct 'Content-Type': 'multipart/form-data' automatically
      });

      if (!apiResponse.ok) {
        throw new Error(`API call failed: ${apiResponse.statusText}`);
      }
      
      // 5. Assuming the backend returns the GLB file directly or a JSON with a GLB file URL
      // If it returns a GLB file:
      const glbBlob = await apiResponse.blob();
      console.log("Received GLB data:", glbBlob);

      // Optionally, you can create a URL for the GLB file to download it or display it
      const glbUrl = URL.createObjectURL(glbBlob);
      console.log("GLB File URL:", glbUrl);

      // If it returns JSON with a GLB URL or other data:
      // const result = await apiResponse.json();
      // console.log("API Result:", result);


    } catch (error) {
      console.error("Error in 3D generation process:", error);
    }
  };

  const handleExport = (imageData) => {
    console.log("Canvas exported (data not used for this specific image upload logic):", imageData);

    // If you want to use the SketchCanvas output data instead of the local file,
    // you would convert 'imageData' (likely a data URL or Blob) to FormData here
    
    // For this example, we'll focus on the local image upload
  };

  // Run the upload function when the component mounts or based on a button click
  // For the prompt's request, I'll put it in an effect to run once, 
  // but typically you'd trigger this with a button or after a user action.
  useEffect(() => {
    uploadAndGenerate();
  }, []);

  return (
    <div>
      <h1>Draw Your Sketch</h1>
      <p>Attempting to upload local image {IMAGE_PATH} to backend...</p>
      <SketchCanvas onExport={handleExport} />
    </div>
  );
}