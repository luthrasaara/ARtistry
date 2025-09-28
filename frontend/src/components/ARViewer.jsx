import React from 'react';

// Placeholder path for your GLB model. Adjust this to point to your actual file.
const GLB_MODEL_PATH = "./heart.glb"; 

// Since this is JSX, we just use the custom element directly.
const ModelViewerAR = ({ modelPath = GLB_MODEL_PATH }) => {
  return (
    // Container fixed to the viewport for a full-screen AR experience
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: '#000' }}>
        
        {/* The model-viewer element handles all 3D rendering and AR logic */}
        <model-viewer
            src={modelPath}                                 // 1. Path to your .glb file
            ar                                              // 2. Activates the AR button and functionality
            ar-modes="webxr scene-viewer quick-look"        // 3. Specifies AR methods: WebXR (desktop/Android), Scene Viewer (Android native), Quick Look (iOS native)
            camera-controls                                 // Allows users to rotate/zoom the model in 3D mode
            shadow-intensity="1"                            // Adds realistic shadow
            alt="A 3D model in augmented reality"
            style={{ width: '80%', height: '70%' }}       // Ensures model-viewer fills the container
        >
             {/* Optional: Add a custom styled AR button */}
            
        </model-viewer>


    </div>
  );
};



export default ModelViewerAR;