import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Zap } from 'lucide-react'; 

// === IMPORTANT DEPENDENCY NOTE ===
// This component relies on these libraries being loaded globally BEFORE the React component starts.
// They MUST be loaded via <script> tags in your main HTML file.
const THREE = window.THREE;
const GLTFLoader = (THREE && THREE.GLTFLoader) ? THREE.GLTFLoader : (window.GLTFLoader || null); 
const OrbitControls = (THREE && THREE.OrbitControls) ? THREE.OrbitControls : (window.OrbitControls || null); 
// =================================

// Hardcoded GLB path as requested.
const GLB_MODEL_PATH = "/2020_mclaren_gt.glb";

// Define a constant for the desired scale factor
const MODEL_SCALE_MULTIPLIER = 3.0; 

// Custom button component using Tailwind classes (simulating shadcn/ui styles)
const Button = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium 
      rounded-xl shadow-lg transition-colors duration-200 
      ${disabled 
        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:bg-indigo-800'
      }
      ${className}
    `}
  >
    {children}
  </button>
);

const ARViewer = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  
  // THREE.js Scene Refs for persistent access
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Only using OrbitControls for mouse/touch interaction
  const controlsOrbitRef = useRef(null); 
  
  const modelRef = useRef(null); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModelPath, setCurrentModelPath] = useState(GLB_MODEL_PATH);

  // --- MODEL LOADING LOGIC ---
  const loadGlbModel = useCallback((path, scene) => {
    if (!scene || !GLTFLoader) return;

    setLoading(true);
    setError(null);
    
    // 1. Clean up old model if it exists
    if (modelRef.current) {
        scene.remove(modelRef.current);
        // Dispose of resources to prevent memory leaks
        modelRef.current.traverse((child) => {
            if (child.isMesh) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
                child.geometry.dispose();
            }
        });
    }

    // 2. Load new model
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const newModel = gltf.scene;
        
        // Setup shadows and materials
        newModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Calculate model normalization and initial position
        const bbox = new THREE.Box3().setFromObject(newModel);
        const size = bbox.getSize(new THREE.Vector3());
        
        // Normalize size and apply the multiplier for a large, "in-your-face" view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (1.0 / maxDim) * MODEL_SCALE_MULTIPLIER; 
        newModel.scale.set(scale, scale, scale);
        
        // Center model on virtual ground (y=0) 
        //newModel.position.y = -size.y * scale / 2;
        
        // **FIX 2: Adjusted Z position to place the model slightly further away**
        // The camera is at z=1, so placing the model at z=-1.5 puts it 2.5 units away, 
        // which gives a better initial perspective.
        //newModel.position.z = -1.5; 
        newModel.position.set(0, 0, -2.0);
        
        scene.add(newModel);
        modelRef.current = newModel;
        
        setCurrentModelPath(path.startsWith('blob:') ? 'User Uploaded File' : path);
        setLoading(false);
      },
      (xhr) => {
        // console.log(`GLB model load progress: ${(xhr.loaded / xhr.total) * 100}%`);
      },
      (err) => {
        console.error("Error loading GLB model:", err);
        setError({ message: `Failed to load model from ${path}. Check the file path and CORS settings. If the file is valid, the model might be too small/far away.` });
        setLoading(false);
      }
    );
  }, []);

  // --- SCENE INITIALIZATION ---
  const initScene = useCallback(() => {
    // 0. Dependency Check - only checking for OrbitControls now
    if (!THREE || !GLTFLoader || !OrbitControls) {
      setError({
        message: "3D libraries (THREE.js, GLTFLoader, OrbitControls) are missing.",
        scripts: [
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
          "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
          "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
        ]
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Cleanup previous instance
    if (rendererRef.current) {
        rendererRef.current.dispose();
        controlsOrbitRef.current?.dispose();
    }
    
    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0); 

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // 1b. Add OrbitControls (always active)
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true; 
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 1;
    orbitControls.maxDistance = 10;
    
    // **FIX 1: Set OrbitControls target to the model's new initial Z position (-1.5)**
    orbitControls.target.set(0, 0, -1.5); 
    
    // **FIX 1: Move camera much closer (z=1.0) for an AR-like overlay perspective.**
    camera.position.z = 1.0; 
    
    controlsOrbitRef.current = orbitControls;
    
    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 3. Handle Video Stream for AR Background
    const setupVideoStream = async () => {
      // Stop any existing stream
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      try {
        // Request back camera access for AR experience
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        
      } catch (err) {
        console.error("Error accessing webcam: ", err);
        setError({ message: "Could not access webcam. Ensure you grant camera permissions." });
        setIsStreaming(false);
        setLoading(false);
      }
    };
    
    // 4. Load initial model
    loadGlbModel(GLB_MODEL_PATH, scene);

    // 5. Animation Loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      // Only update Orbit controls
      controlsOrbitRef.current.update();

      renderer.render(scene, camera);
      return animationId;
    };
    
    // 6. Handle Resize
    const handleResize = () => {
      if (canvasRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start video stream and animation
    setupVideoStream();
    let animationId = animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      rendererRef.current?.dispose();
      controlsOrbitRef.current?.dispose();
    };
    
  }, [loadGlbModel]); 

  useEffect(() => {
    initScene();
  }, [initScene]);
  
  return (
    // Centering: Container is already correctly centered
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-900 text-white p-4 font-sans">
      <h1 className="text-3xl font-extrabold mb-2 text-center text-indigo-400">
        Webcam Viewer
      </h1>
      <p className="text-center text-sm mb-4 text-gray-400">
        Use mouse or touch gestures to rotate and zoom the model.
      </p>

      {/* Control Panel */}
      <div className="flex justify-center space-x-4 mb-4 flex-wrap gap-2">
        <Button onClick={initScene} disabled={loading} className="bg-gray-700 hover:bg-gray-600">
            <RefreshCw className="w-4 h-4" />
            <span>{loading ? 'Initializing...' : 'Restart Viewer'}</span>
        </Button>
      </div>

      {/* Viewer Area: Correctly constrained for centering */}
      <div className="relative w-full max-w-4xl max-h-[80vh] bg-black rounded-xl overflow-hidden shadow-2xl min-h-[300px]">
        
        {/* Static Video element background */}
        <video ref={videoRef} autoPlay muted playsInline 
               className="absolute top-0 left-0 w-full h-full object-cover z-0" 
               style={{ opacity: 1 }}></video>
        
        {/* Canvas for Three.js rendering. Renders transparently on top (z-index: 10) */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-10"></canvas>
        
        {/* Loading/Error Overlays */}
        {(loading && !error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm z-20">
            <div className="text-center p-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
              <p className="mt-2 text-lg font-medium">Setting up environment...</p>
              <p className="text-sm text-gray-400 mt-1">Accessing camera and loading 3D model...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-4 z-30">
            <div className="text-center max-w-lg mx-auto rounded-xl bg-red-800 p-6 shadow-xl border-4 border-red-500">
              <Zap className="w-8 h-8 mx-auto text-yellow-300 mb-3" />
              <p className="text-xl font-bold mb-2">CRITICAL ERROR: {error.message}</p>
              
              {error.scripts && (
                <>
                  <p className="text-sm text-red-200 mb-4">
                    This component needs external JavaScript libraries to function. You **MUST** add the following scripts to your main HTML file:
                  </p>
                  <div className="bg-gray-900 p-3 rounded-lg text-left text-xs space-y-2 font-mono">
                    {error.scripts.map((script, index) => (
                        <code key={index} className="block whitespace-nowrap overflow-x-auto text-green-400">
                            &lt;script src="{script}"&gt;&lt;/script&gt;
                        </code>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom indicator (Simplified) */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900/70 text-xs px-3 py-1 rounded-full shadow-lg border border-indigo-500/50">
            <span className="font-bold mr-1">Mode:</span> 
            <code className="font-mono font-medium text-pink-300">ORBIT (Mouse/Touch)</code>
            <span className="ml-3 font-bold mr-1">Model:</span> 
            <code className="text-indigo-300 font-mono">{currentModelPath}</code>
        </div>
      </div>
    </div>
  );
};

// Must be the default export named App
export default function App() {
    return <ARViewer />;
}