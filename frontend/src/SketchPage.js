import React, { useRef, useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./SketchPage.css";



import { 
  Home, 
  Edit3, 
  Eraser, 
  RotateCcw, 
  Download, 
  Trash2, 
  Loader2, 
  Minus, 
  Plus 
} from "lucide-react";



// The backend endpoint for sending the image data
const BACKEND_API_URL = "http://127.0.0.1:5000/image_to_ar/"; 
const IMAGE_PATH = "/rose.png"; 



// --- SketchToolbar Component (Inline) ---
const SketchToolbar = ({ 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  undo, 
  clearCanvas, 
  isEraser, 
  exportCanvas, 
  setIsEraser,
  isGenerating
}) => {
  const commonColors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
    "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"
  ];
  

const buttonClass = (isActive) => `
  flex items-center justify-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 
  shadow-sm text-sm font-medium whitespace-nowrap flex-shrink-0
  ${isActive 
    ? 'bg-red-500 border-red-700 text-white hover:bg-red-600' 
    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
  }
`;

  const controlButtonClass = `
    w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center 
    bg-white shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors
  `;



  return (

  
    <>
<div className="flex items-center gap-5 flex-wrap bg-gray-50 rounded-lg p-3 shadow-sm w-full ml-4">
  {/* Color Picker */}
  <input 
    type="color"
    value={color}
    onChange={(e) => { setIsEraser(false); setColor(e.target.value); }}
    className="w-12 h-10 border-2 border-gray-300 cursor-pointer p-0 rounded-md"
  />
</div>

                                 

        {/* Brush Size */}
        <div className="flex items-center gap-4 bg-green-50/70 rounded-xl p-3 shadow-inner w-full">
          <Edit3 className="w-5 h-5 text-gray-700 flex-shrink-0" />

          <button 
            onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
            className={controlButtonClass}
            aria-label="Decrease line width"
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <input
            type="range"
            min="1"
            max="30"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg"
            aria-label="Line width slider"
          />
          
          <button 
            onClick={() => setLineWidth(Math.min(30, parseInt(lineWidth) + 1))}
            className={controlButtonClass}
            aria-label="Increase line width"
          >
            <Plus className="w-3 h-3"/>
          </button>

          <span className="text-sm font-bold w-12 text-left">{lineWidth}px</span>
        </div>


      {/* Actions */}
      <div className="flex items-center gap-4 justify-start bg-gray-50 rounded-lg p-3 shadow-sm w-full flex-wrap">
        {/* Toggle Pen/Eraser */}
        <button 
          onClick={() => setIsEraser(!isEraser)} 
          className={buttonClass(isEraser)}
        >
          {isEraser ? <Edit3 className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
          {isEraser ? 'Pen' : 'Eraser'}
        </button>
        
        {/* Undo */}
        <button onClick={undo} className={buttonClass(false)}>
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>
        
        {/* Export / Generate */}
        <button 
          onClick={exportCanvas} 
          className={`
            ${buttonClass(false)} !bg-blue-600 !text-white !border-blue-700 
            hover:!bg-blue-700 hover:!border-blue-800
            ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
          `}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isGenerating ? 'Generating...' : 'Export'}
        </button>

        {/* Clear */}
        <button 
          onClick={clearCanvas} 
          className="bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 flex items-center p-2 rounded-xl text-sm transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </>
    
  );
};


// --- Main App Component ---

const SketchPage = () => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('Draw an object and hit Export to convert it to a 3D model.');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // --- Canvas Drawing Utilities (unchanged) ---

  const drawGrid = useCallback((ctx, width, height) => {
    const gridSize = 20; 
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; 
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    // Draw grid lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw thicker lines for every 5th grid section
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x <= width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const redrawCanvas = useCallback((snapshot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      drawGrid(ctx, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    if (snapshot) {
      img.src = snapshot;
    } else {
      drawGrid(ctx, canvas.width, canvas.height);
    }
  }, [drawGrid]);
  
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setCursorPos({ x: clientX, y: clientY }); 

    return { x, y };
  };

  // --- Drawing Handlers (unchanged) ---

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current.getContext("2d");
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current.getContext("2d");
    
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (!drawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    ctx.globalCompositeOperation = "source-over"; 
    
    if (e.type === 'mouseup' || e.type === 'touchend' || e.type === 'mouseleave' || e.type === 'touchcancel') {
        const snapshot = canvas.toDataURL();
        setHistory((prev) => [...prev, snapshot]);
    }
    setDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1) {
      clearCanvas();
      return;
    }

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    redrawCanvas(newHistory[newHistory.length - 1]);
  };

  const clearCanvas = () => {
    setHistory([]);
    redrawCanvas(null); 
  };
  
  // --- API/Export Logic (unchanged) ---

  const handleExport = () => {
    if (isGenerating) return;
    
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");

    const base64Data = dataURL.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    uploadAndGenerate(blob);
  };

  const uploadAndGenerate = async (imageBlob) => {
    setIsGenerating(true);
    setMessage("Sending sketch to backend for 3D generation...");
    
    try {
      const formData = new FormData();
      formData.append("file", imageBlob, "sketch.png");

      // Exponential backoff logic
      let apiResponse;
      const MAX_RETRIES = 3;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          apiResponse = await fetch(BACKEND_API_URL, {
            method: "POST",
            body: formData, 
          });
          if (apiResponse.ok) break;
          if (i === MAX_RETRIES - 1) throw new Error(`Failed after ${MAX_RETRIES} attempts.`);

          // Apply exponential backoff delay (1s, 2s, 4s...)
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (fetchError) {
          if (i === MAX_RETRIES - 1) throw fetchError;
        }
      }

      if (!apiResponse || !apiResponse.ok) {
        throw new Error(`API call failed with status: ${apiResponse?.status || 'Unknown'}`);
      }
      
      const glbBlob = await apiResponse.blob();
      
      const glbUrl = URL.createObjectURL(glbBlob);
      const link = document.createElement('a');
      link.href = glbUrl;
      link.download = '3d_model.glb';
      link.click();
      URL.revokeObjectURL(glbUrl);
      
      setMessage("3D model generated and download started!");

    } catch (error) {
      console.error("Error in 3D generation process:", error);
      setMessage(`Error: Failed to generate 3D model. Check console for details. (${error.message})`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setMessage('Draw an object and hit Export to convert it to a 3D model.'), 5000);
    }
  };

  // --- Effects (unchanged) ---

  // 1. Full screen canvas sizing (Responsive)
  useEffect(() => {
    const updateCanvasSize = () => {
      // Use the ID now that it's defined in the return block
      const container = document.getElementById('canvas-container'); 
      if (!container) return;
      
      // Calculate available space based on the container size
      setCanvasSize({ 
        width: container.clientWidth - 8, // minor padding adjustment
        height: container.clientHeight - 8
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // 2. Initialize Canvas and redraw on size/history change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas resolution attributes
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const lastSnapshot = history[history.length - 1];
    redrawCanvas(lastSnapshot);
    
  }, [canvasSize, history.length, redrawCanvas]);


  return (
    
    // Add main ID for structural CSS targeting
    <div id="main-app" className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 overflow-hidden font-inter">
      <div id="app-content" className="h-screen flex flex-col gap-8">

        <Link to="/" className="home-btn" title="Home">
    <img src="home.png" alt="Home" className="home-icon" />
  </Link>
        
        <div
          id="header-bar"
          style={{
            width: "100%",
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderBottom: "1px solid rgba(255, 255, 255, 0)",
          }}
        >
          
          <h1
            style={{
              margin: 0,
              fontSize: "2.5rem",
              fontWeight: 2000, // 👈 Extra bold
              fontFamily: "'Baloo 2', cursive",
              background: "linear-gradient(to right, #2563eb, #9333ea)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "3rem"
            }}
          >
            Digital Sketch Canvas
          </h1>
          <p
            style={{
              color: "#4b5563", // gray-600
              fontSize: "1rem",
              marginTop: "0.50rem",
              fontFamily: "sans-serif",
            }}
          >
            Draw an object and hit Export to convert it to a 3D model (via 2D export).
          </p>
        </div> 
        {/* Toolbar Component */}
        <div id="toolbar-wrapper" className="flex justify-center px-4 pt-4 flex-shrink-0">
          <SketchToolbar
            color={color}
            setColor={setColor}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            undo={undo}
            clearCanvas={clearCanvas}
            exportCanvas={handleExport}
            isEraser={isEraser}
            setIsEraser={setIsEraser}
            isGenerating={isGenerating}
          />
        </div>

        {/* Canvas Drawing Area Container */}
        <div id="canvas-container" className="flex-1 px-4 pb-4 overflow-hidden min-h-0 pt-4">
            <div className="h-full bg-white/90 rounded-2xl shadow-2xl border border-gray-200 p-2 transition-all duration-500">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className={`w-full h-full rounded-xl transition-all duration-300 ${
                        isEraser ? 'cursor-cell' : 'cursor-crosshair'
                    }`}
                    style={{
                        backgroundColor: "#fff",
                        boxShadow: "inset 0 0 10px rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.2)"
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                />
            </div>
            
            {/* Custom cursor when drawing */}
            {drawing && (
            <div 
                className="fixed pointer-events-none z-50 rounded-full border-2 border-gray-400 mix-blend-difference transition-all duration-100"
                style={{
                width: `${lineWidth * 2}px`,
                height: `${lineWidth * 2}px`,
                backgroundColor: isEraser ? 'rgba(239, 68, 68, 0.5)' : `${color}40`,
                transform: 'translate(-50%, -50%)',
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`
                }}
            />
            )}
        </div>
        
        {/* Footer */}
        <div id="footer-bar" className="text-center py-2 px-4 bg-white/60 backdrop-blur-md border-t border-white/20 flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-500">
            Current Tool: <span 
              className="inline-block w-3 h-3 rounded-full border border-gray-300 mx-1"
              style={{ backgroundColor: isEraser ? '#ef4444' : color }}
            ></span>
            <span className="font-medium">{lineWidth}px {isEraser ? 'Eraser' : 'Pen'}</span>
            <span className="hidden sm:inline"> • History: {history.length} steps</span>
          </p>
        </div>
      </div>

      {/* Adding a raw style block to enforce critical layout properties using standard CSS */}
      <style>{`
        /* Essential Layout Fixes using Standard CSS targeting IDs */
        #main-app {
          font-family: Inter, sans-serif;
        }
        #app-content {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* Prevent body scroll */
        }
        #toolbar-wrapper {
          display: flex;
          justify-content: center;
          flex-shrink: 0; /* Prevents toolbar from shrinking */
        }
        #canvas-container {
          flex-grow: 1;
          overflow: hidden; /* Hide canvas container overflow */
          min-height: 0; /* Allows flex-grow to work properly */
        }
        #canvas-container > div {
          height: 100%;
          width: 100%;
        }
        canvas {
          display: block; /* Important for preventing extra space below canvas */
        }
        
        /* Custom styling for range input track/thumb (Retained) */
        input[type=range]::-webkit-slider-runnable-track {
            height: 8px;
            background: #dbeafe; 
            border-radius: 4px;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            margin-top: -4px;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6; 
            cursor: pointer;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

export default SketchPage;
