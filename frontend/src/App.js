import React, { useEffect } from "react";
import SketchCanvas from "./components/SketchCanvas";
import ARViewer from "./components/ARViewer";

const BACKEND_API_URL = "http://127.0.0.1:5000/image_to_ar/"; // **Replace with your actual backend endpoint**
const IMAGE_PATH = "/rose.png"; // **Path relative to your public folder**

export default function CreatePage() {
  /*
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
  }, []);*/

  return (
    <div>
      <ARViewer />
    </div>
  );
}