import React from 'react';
import 'aframe'; // Import A-Frame
// You may need to import the AR.js script directly or ensure your chosen react-aframe-ar 
// setup handles it. For simplicity, assume it's loaded in index.html or imported.
import { Scene } from 'react-aframe-ar'; // Use components from a react-aframe wrapper


// recieve the path from backend after 3d generation
const GLB_MODEL_PATH = './2020_mclaren_gt.glb'; 


function ARModelComponent() {
  return (
    // <Scene> is the main A-Frame/AR.js scene container
    // 'arjs' initializes the AR system, here using a marker-based setup
    <Scene embedded arjs='sourceType: webcam;'>
      
      {/* a-assets is used for pre-loading assets, which improves performance */}
      <a-assets>
        {/* Load the GLB model */}
        <a-asset-item 
          id="my-glb-model" 
          src={GLB_MODEL_PATH}>
        </a-asset-item>
      </a-assets>

      {/* a-marker-camera or a-marker is used for marker-based AR 
          'preset: hiro' is a default marker pattern (you can use custom ones too)
      */}
      <a-marker preset="hiro">
        {/* a-entity with gltf-model attribute loads the GLB file 
            You reference the pre-loaded asset using #id
        */}
        <a-entity
          gltf-model="#my-glb-model"
          scale="0.5 0.5 0.5" // Adjust scale as needed
          position="0 0 0"   // Position relative to the marker
        />
      </a-marker>

      {/* Define the camera for the AR experience */}
      <a-entity camera>
        <a-entity cursor="fuse: true; maxDistance: 30; timeout: 500"
          position="0 0 -1"
          geometry="primitive: ring; radiusOuter: 0.03; radiusInner: 0.02;"
          material="color: black; shader: flat">
        </a-entity>
      </a-entity>
    </Scene>
  );
}

export default ARModelComponent;