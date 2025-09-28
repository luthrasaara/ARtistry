// App.js (Frontend)

import React, { useState, useRef } from "react"; // <-- Add useRef
import SketchCanvas from "./components/SketchCanvas";
import ARViewer from "./components/ARViewer";

const DETECT_API_URL = "http://localhost:8000/detect_objects/"; // Ensure this port is correct
const AR_GENERATE_API_URL = "http://localhost:8000/image_to_ar/";
const GENERATED_MODEL_PATH = "/generated_models/output.glb"; // This path might need dynamic adjustment later

const VIEWS = {
  DRAWING: 'drawing',
  DETECTED: 'detected',
  AR_VIEWER: 'ar_viewer',
};

// --- New Component for Displaying Detection ---
// You might put this in a separate file (e.g., DetectedImageDisplay.jsx)
const DetectedImageDisplay = ({ base64Image, detectedObjects, onGenerateAR, isLoading }) => {
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (base64Image && detectedObjects && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Assuming your canvas matches the original image dimensions (e.g., 400x400)
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear existing content
        ctx.drawImage(img, 0, 0, img.width, img.height); // Draw the original image

        detectedObjects.forEach(obj => {
          const [x1, y1, x2, y2] = obj.bounding_box;
          const width = x2 - x1;
          const height = y2 - y1;

          // Draw Rectangle
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x1, y1, width, height);

          // Draw Label
          ctx.fillStyle = 'red';
          ctx.font = '16px Arial';
          ctx.fillText(obj.name, x1, y1 > 10 ? y1 - 5 : y1 + 15); // Adjust label position
        });
      };
      img.src = base64Image;
    }
  }, [base64Image, detectedObjects]);

  return (
    <div>
      <h3>Detected Objects:</h3>
      <canvas ref={canvasRef} style={{ border: '1px solid black', maxWidth: '100%' }} />
      <button 
        onClick={onGenerateAR} 
        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}
        disabled={isLoading}
      >
        {isLoading ? 'Generating AR Model... ⏳' : 'Next: Generate AR Model'}
      </button>
      {isLoading && <p>This might take a moment.</p>}
    </div>
  );
};
// --- End New Component ---


export default function CreatePage() {
  const [currentView, setCurrentView] = useState(VIEWS.DRAWING);
  const [detectResult, setDetectResult] = useState(null); // Will store { objects, image }
  const [modelUrl, setModelUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Store the actual image blob here if you intend to send it to AR_GENERATE_API_URL
  const [originalImageBlob, setOriginalImageBlob] = useState(null); 


  const handleExport = async (imageBlob) => {
    if (!imageBlob) return;

    setIsLoading(true);
    setDetectResult(null);
    setOriginalImageBlob(imageBlob); // Save the original blob

    try {
      const formData = new FormData();
      formData.append("file", imageBlob, "user_drawing.png");

      console.log("Sending drawing to detect_draw...");
      const response = await fetch(DETECT_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Detection API failed: ${response.statusText} - ${errorData.error}`);
      }

      const result = await response.json();
      console.log("Detection result:", result);

      // Store result and move to DETECTED view
      setDetectResult(result); // result now contains { objects, image }
      setCurrentView(VIEWS.DETECTED);

    } catch (error) {
      console.error("Error detecting drawing:", error);
      alert(`Error detecting drawing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAR = async () => {
    // 🛑 IMPORTANT: Pass the ORIGINAL IMAGE BLOB, not the JSON detection result
    if (!originalImageBlob) {
        alert("No original image to generate AR model from.");
        return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", originalImageBlob, "user_drawing.png"); // Re-sending original image

      const response = await fetch(AR_GENERATE_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AR Generation API failed: ${response.statusText} - ${errorData.error}`);
      }
      
      // FastAPI's FileResponse will return the GLB directly.
      // We need to save it or create a URL for it.
      // For simplicity, let's assume the GLB is saved to /public/generated_models
      // and we just point to its public URL based on the filename returned by backend.
      // (Your backend returns FileResponse, which means the browser will download it,
      // or you need to process it. Let's adjust backend to return the filename.)

      // Adjusting this part based on your backend:
      // If your backend returns a FileResponse, the browser will try to download it.
      // For ARViewer, you usually want a direct URL.
      // Let's assume your backend is modified to return JSON with the model's URL:
      const arResult = await response.json(); // Assuming backend returns {"model_url": "/generated_models/xyz.glb"}
      const model_public_url = arResult.model_url; // e.g. /generated_models/ar_model_xxxx.glb

      console.log("AR model generated at:", model_public_url);
      setModelUrl(model_public_url);
      setCurrentView(VIEWS.AR_VIEWER);

    } catch (error) {
      console.error("Error generating AR model:", error);
      alert(`Error generating AR model: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleBackToDrawing = () => {
    setCurrentView(VIEWS.DRAWING);
    setDetectResult(null);
    setModelUrl(null);
    setOriginalImageBlob(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case VIEWS.DRAWING:
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h2>Draw Your Masterpiece ✏️</h2>
            <SketchCanvas onExport={handleExport} isLoading={isLoading} />
            {isLoading && <p style={{ textAlign: 'center', marginTop: '10px' }}>**Detecting... Please wait.**</p>}
          </div>
        );

      case VIEWS.DETECTED:
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={handleBackToDrawing} style={{ padding: '10px', marginBottom: '10px' }}>
              ← Back to Drawing
            </button>
            {detectResult && detectResult.image && detectResult.objects ? (
                <DetectedImageDisplay 
                    base64Image={detectResult.image} 
                    detectedObjects={detectResult.objects} 
                    onGenerateAR={handleGenerateAR}
                    isLoading={isLoading}
                />
            ) : (
                <p>No detection results to display.</p>
            )}
            {/* Old raw JSON display, you might remove this or keep it for debugging */}
            {/* <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
              {JSON.stringify(detectResult.objects, null, 2)}
            </pre> */}
            
          </div>
        );

      case VIEWS.AR_VIEWER:
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={handleBackToDrawing} style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}>
              ← Back to Drawing
            </button>
            <h2>Your AR Model ✨</h2>
            <div style={{ flexGrow: 1 }}>
              <ARViewer modelPath={modelUrl} />
            </div>
          </div>
        );

      default:
        return <div>An unexpected error occurred.</div>;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Draw and Create AR App</h1>
      {renderContent()}
    </div>
  );
}