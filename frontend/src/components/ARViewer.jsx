

import React, { useRef, useEffect } from 'react';

const GLB_MODEL_PATH = "./generated_models/heart.glb"; 


const ARViewer = ({ modelPath = GLB_MODEL_PATH }) => {
  // 1. Create a ref to attach to the <video> element
  const videoRef = useRef(null); 
  // Ref to hold the stream object, which is useful for cleanup
  const streamRef = useRef(null);

  useEffect(() => {
    // 2. Define the asynchronous function to start the webcam
    const startWebcam = async () => {
      try {
        // Request access to the user's camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });

        // Store the stream for later cleanup
        streamRef.current = stream;

        // 3. Connect the stream to the video element inside the div
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
  
  // Wait for the video metadata (like duration, size) to load
  // before forcing playback.
          videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => {
          // Catch potential Autoplay policy errors (e.g., user interaction is required)
          console.log("Autoplay blocked:", e);
      });
  };
}
      } catch (err) {
        // 4. Handle errors (e.g., user blocked access or no camera found)
        console.error("Error accessing the webcam:", err);
        // You can display an error message in the div here if needed
      }
    };

    // 5. Run the function on component mount
    startWebcam();
    
    // 6. Cleanup function: stop all tracks (camera) when the component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
            track.stop(); // Stops the camera and turns off the light
        });
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    // This outer <div> is the container you requested
    <div style={{ 
        width: '100%', 
        height: '100vh',
        margin: '20px auto', 
        borderRadius: '8px',
        overflow: 'hidden'
    }}>
      {/* The <video> element inside the <div> is what displays the stream */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted // Muted prevents audio feedback loops, which is often good practice
        style={{ width: '100%', display: 'block' }} 
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
        
        <model-viewer
            src={modelPath}                                 // 1. Path to your .glb file
            ar                                              // 2. Activates the AR button and functionality
            ar-modes="webxr scene-viewer quick-look"        // 3. Specifies AR methods: WebXR (desktop/Android), Scene Viewer (Android native), Quick Look (iOS native)
            camera-controls                                 // Allows users to rotate/zoom the model in 3D mode
            shadow-intensity="1"                            // Adds realistic shadow
            alt="A 3D model in augmented reality"
            style={{ width: '90%', height: '90%' }}       // Ensures model-viewer fills the container
        >
            
        </model-viewer>


    </div>
    </div>
  );
};

export default ARViewer;


/*
export default WebcamComponent;
// Placeholder path for your GLB model. Adjust this to point to your actual file.
const GLB_MODEL_PATH = "./heart.glb"; 

// Since this is JSX, we just use the custom element directly.
const ModelViewerAR = ({ modelPath = GLB_MODEL_PATH }) => {
  return (
    // Container fixed to the viewport for a full-screen AR experience
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: '#000' }}>
        
        <model-viewer
            src={modelPath}                                 // 1. Path to your .glb file
            ar                                              // 2. Activates the AR button and functionality
            ar-modes="webxr scene-viewer quick-look"        // 3. Specifies AR methods: WebXR (desktop/Android), Scene Viewer (Android native), Quick Look (iOS native)
            camera-controls                                 // Allows users to rotate/zoom the model in 3D mode
            shadow-intensity="1"                            // Adds realistic shadow
            alt="A 3D model in augmented reality"
            style={{ width: '80%', height: '70%' }}       // Ensures model-viewer fills the container
        >
            
        </model-viewer>


    </div>
  );
};



export default ModelViewerAR;*/