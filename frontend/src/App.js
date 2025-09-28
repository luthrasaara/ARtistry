import React, { useState, useRef, useEffect, useCallback } from "react"; 
import ReactDOM from 'react-dom/client';
import { RefreshCw, Loader2, Zap, Palette, Eraser, Edit3, RotateCcw, Trash2, Download, Minus, Plus } from 'lucide-react'; 
import ARViewer from './components/ARViewer';
import './index.css'; 

const DETECT_API_URL = "http://localhost:8000/detect_objects/"; 
// const AR_GENERATE_API_URL = "http://localhost:8000/image_to_ar/";

// Set the public URL for the hardcoded heart.glb model
const GENERATED_MODEL_PUBLIC_URL = "/generated_models/heart.glb"; 

// --- POLLING CONFIGURATION FOR LONG GENERATION JOBS ---
const POLLING_INTERVAL_MS = 10000; // Check every 10 seconds
const MAX_POLLING_RETRIES = 25; // Max wait time: 25 * 10s = 250 seconds (~4 minutes 10 seconds)
// --------------------------------------------------------

const VIEWS = {
  DRAWING: 'drawing',
  DETECTED: 'detected',
  AR_VIEWER: 'ar_viewer',
};

// ===========================================
// 1. SKETCH TOOLBAR COMPONENT (Nested)
// ===========================================
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
  isLoading
}) => {
  const commonColors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
    "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"
  ];
  const exportButtonText = isLoading ? 'Processing...' : 'Detect Drawing';
  const exportButtonDisabled = isLoading;

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="color-picker"
          disabled={exportButtonDisabled}
        />
        {commonColors.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`color-swatch${color === c ? ' selected' : ''}`}
            style={{ backgroundColor: c }}
            disabled={exportButtonDisabled}
          />
        ))}
      </div>
      <div className="toolbar-section">
        <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} disabled={exportButtonDisabled}>-</button>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={e => setLineWidth(Number(e.target.value))}
          className="brush-range"
          disabled={exportButtonDisabled}
        />
        <button onClick={() => setLineWidth(Math.min(20, lineWidth + 1))} disabled={exportButtonDisabled}>+</button>
        <span className="brush-size" style={{ background: isEraser ? '#ef4444' : color }}></span>
        <span>{lineWidth}px</span>
      </div>
      <div className="toolbar-section">
        <button onClick={() => setIsEraser(!isEraser)} disabled={exportButtonDisabled}>
          {isEraser ? 'Pen' : 'Eraser'}
        </button>
        <button onClick={undo} disabled={exportButtonDisabled}>Undo</button>
        <button onClick={clearCanvas} disabled={exportButtonDisabled}>Clear</button>
        <button onClick={exportCanvas} disabled={exportButtonDisabled}>{exportButtonText}</button>
      </div>
    </div>
  );
};

// ===========================================
// 2. DRAWING VIEW (Replaces SketchCanvas for full drawing screen)
// ===========================================
const DrawingView = ({ onExport, isLoading }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(6);
  const [history, setHistory] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  // Create grid pattern
  const drawGrid = useCallback((ctx, width, height) => {
    const gridSize = 20; // 20px grid
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // Faint blue color
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Add a subtle highlight every 5th line (100px)
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

  // Full screen canvas sizing logic
  useEffect(() => {
    const updateCanvasSize = () => {
      // Get the bounding box of the canvas container
      const containerElement = containerRef.current;
      if (!containerElement) return;

      const rect = containerElement.getBoundingClientRect();
      const toolbarHeight = 120; // Estimated max height for the toolbar when folded on desktop

      // Calculate available space in the current container
      const availableWidth = rect.width;
      const availableHeight = window.innerHeight - rect.top - toolbarHeight - 20; 
      
      setCanvasSize({ 
        width: Math.max(400, availableWidth), 
        height: Math.max(300, availableHeight) 
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Initialize canvas with size, background, and grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas resolution for drawing
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d");
    
    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // If there is history, redraw the last state
    if (history.length > 0) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = history[history.length - 1];
    }
    
  }, [canvasSize, drawGrid, history]);
  
  // Resizes the canvas content when canvasSize changes (to prevent history clear)
  const redrawCanvasFromHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Redraw the entire canvas background and grid first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Redraw the latest state from history if available
    if (history.length > 0) {
        const img = new Image();
        img.onload = () => {
            // Draw image on the new canvas size
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
        };
        img.src = history[history.length - 1];
    }
  }, [history, drawGrid]);
  
  // Re-draw history when canvas size changes (only redraw if history exists)
  useEffect(() => {
    redrawCanvasFromHistory();
    // This effect is deliberately run on canvasSize change, but must be after
    // the previous useEffect which sets up the initial canvas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);


  // Handle both mouse and touch events
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Calculate the scale factor to map screen pixels to canvas resolution pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: e.nativeEvent.offsetX * scaleX,
        y: e.nativeEvent.offsetY * scaleY
      };
    }
  };

  const startDrawing = (e) => {
    if (isLoading) return; 
    
    e.preventDefault();
    const pos = getEventPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    
    const pos = getEventPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Using destination-out for erasing
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (!drawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over"; // Reset composite operation
    
    // Save state to history (after composite op reset)
    const snapshot = canvas.toDataURL();
    setHistory((prev) => [...prev, snapshot]);
    setDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1) {
      clearCanvas();
      return;
    }

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    // Redraw effect handles the display update via state change
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const exportCanvas = () => {
    if (onExport && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          // Pass the Blob object to the parent component's handler (onExport)
          onExport(blob);
        } else {
          console.error("Failed to generate Blob from canvas.");
        }
      }, 'image/png'); // Specify the desired MIME type
    }
  };

  return (
    <div className="drawing-bg">
      <div className="drawing-container" ref={containerRef}>
        <div className="drawing-header">
          <h1 className="drawing-title">Digital Sketch Canvas</h1>
          <p className="drawing-subtitle">Create on an infinite grid canvas</p>
        </div>
        <SketchToolbar
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          undo={undo}
          clearCanvas={clearCanvas}
          exportCanvas={exportCanvas}
          isEraser={isEraser}
          setIsEraser={setIsEraser}
          isLoading={isLoading}
        />
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className={`drawing-canvas${isEraser ? ' eraser' : ''}${drawing ? ' drawing' : ''}${isLoading ? ' loading' : ''}`}
            style={{
              backgroundColor: "#fff"
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
        <div className="drawing-footer">
          <span>{isEraser ? 'Erasing' : 'Drawing'} • </span>
          <span className="footer-dot" style={{ background: isEraser ? '#ef4444' : color }}></span>
          <span>{lineWidth}px {isEraser ? 'eraser' : 'pen'}</span>
          {isLoading && <span className="footer-loading">| Detecting drawing...</span>}
        </div>
      </div>
      {drawing && (
        <div
          className="custom-cursor"
          style={{
            width: `${lineWidth * 2}px`,
            height: `${lineWidth * 2}px`,
            backgroundColor: isEraser ? 'rgba(239, 68, 68, 0.5)' : `${color}40`
          }}
        />
      )}
    </div>
  );
};


// ===========================================
// 3. AR VIEWER COMPONENT (Integrated - THREE.js)
// ===========================================

// Helper component for styled buttons
const Button = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`custom-btn ${disabled ? 'btn-disabled' : ''} ${className}`}
  >
    {children}
  </button>
);


// ===========================================
// 4. DETECTED IMAGE DISPLAY
// ===========================================
const DetectedImageDisplay = ({
  base64Image,
  detectedObjects,
  onGenerateAR,
  isLoading,
  loadingMessage,
  isGenerationFailed
}) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (base64Image && detectedObjects && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 400;
        canvas.height = 400;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;

        detectedObjects.forEach(obj => {
          const [x1, y1, x2, y2] = obj.bounding_box;
          const scaled_x1 = x1 * scaleX;
          const scaled_y1 = y1 * scaleY;
          const scaled_width = (x2 - x1) * scaleX;
          const scaled_height = (y2 - y1) * scaleY;

          // Draw Rectangle
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(scaled_x1, scaled_y1, scaled_width, scaled_height);

          // Draw Label
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.fillText(obj.name, scaled_x1, scaled_y1 > 15 ? scaled_y1 - 5 : scaled_y1 + 15);
        });
      };
      img.src = base64Image;
    }
  }, [base64Image, detectedObjects]);

  // Determine button state and text based on loading/failure status
  const buttonText = isGenerationFailed
    ? 'Retry Generation'
    : (isLoading ? 'Generating AR Model... ⏳' : 'Next: Generate 3D AR Model');

  const buttonClassName = isGenerationFailed
    ? 'btn-error'
    : (isLoading ? 'btn-loading' : 'btn-primary');

  const messageClassName = isGenerationFailed
    ? 'msg-error'
    : 'msg-info';

  return (
    <div className="detected-container">
      <h3 className="detected-title">Detected Objects</h3>
      <div className="detected-canvas-wrap">
        <canvas
          ref={canvasRef}
          width="400"
          height="400"
          className="detected-canvas"
        />
      </div>
      <Button
        onClick={onGenerateAR}
        disabled={isLoading && !isGenerationFailed}
        className={`detected-btn ${buttonClassName}`}
      >
        {buttonText}
      </Button>
      {(isLoading || isGenerationFailed) && (
        <p className={`detected-msg ${messageClassName} ${isLoading ? 'msg-pulse' : ''}`}>
          {loadingMessage || 'Starting generation...'}
        </p>
      )}
    </div>
  );
};


// ===========================================
// 5. MAIN APPLICATION COMPONENT
// ===========================================
export default function CreatePage() {
  const [currentView, setCurrentView] = useState(VIEWS.DRAWING);
  const [detectResult, setDetectResult] = useState(null); 
  const [modelUrl, setModelUrl] = useState(GENERATED_MODEL_PUBLIC_URL); 
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [originalImageBlob, setOriginalImageBlob] = useState(null); 
  const [isGenerationFailed, setIsGenerationFailed] = useState(false); 
  
  // Utility function for polling the generated file
  const pollForModel = useCallback(async (url, maxRetries) => {
    // Wait a brief period before starting the poll to give the server a chance to begin the job
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS / 2)); 
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const remainingSeconds = (maxRetries - attempt) * POLLING_INTERVAL_MS / 1000;
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const secondsPart = Math.floor(remainingSeconds % 60);
        const remainingTimeDisplay = remainingMinutes > 0 
            ? `${remainingMinutes}m ${secondsPart}s` 
            : `${secondsPart}s`;

        setLoadingMessage(`Checking for model... Attempt ${attempt + 1}/${maxRetries}. (~${remainingTimeDisplay} left)`);

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        
        try {
            // Use HEAD request to check for file existence without downloading the whole model
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store' }); 
            
            if (response.ok) {
                console.log("Model found on attempt:", attempt + 1);
                return true; // Success!
            }
            // If response is not ok (e.g., 404), the file is not there yet. Continue polling.
        } catch (error) {
            // Network error while polling. Log and continue.
            console.warn(`Polling failed on attempt ${attempt + 1}. Retrying...`);
        }
    }
    throw new Error("Model generation timed out. The generated file was not found after the maximum waiting period.");
  }, []);


  const handleExport = async (imageBlob) => {
    if (!imageBlob) return;

    setIsLoading(true);
    setDetectResult(null);
    setOriginalImageBlob(imageBlob); 
    setIsGenerationFailed(false); 

    try {
      const formData = new FormData();
      formData.append("file", imageBlob, "user_drawing.png");

      console.log("Sending drawing to detect_draw...");
      const response = await fetch(DETECT_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`Detection API failed: ${response.statusText} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log("Detection result:", result);

      setDetectResult(result); 
      setCurrentView(VIEWS.DETECTED);

    } catch (error) {
      console.error("Error detecting drawing:", error);
      // Use a modal or a notification instead of alert()
      setLoadingMessage(`Error detecting drawing: ${error.message}`);
      setIsGenerationFailed(true); // Treat detection failure like a generation failure to display error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAR = async () => {
    // Skip API call, just show the AR viewer with the hardcoded model
    setIsLoading(true);
    setIsGenerationFailed(false);
    setLoadingMessage("Loading AR model...");
    setTimeout(() => {
      setModelUrl(GENERATED_MODEL_PUBLIC_URL);
      setCurrentView(VIEWS.AR_VIEWER);
      setLoadingMessage('');
      setIsLoading(false);
    }, 800); // Simulate a short loading delay for UX
  };


  const handleBackToDrawing = () => {
    setCurrentView(VIEWS.DRAWING);
    setDetectResult(null);
    setModelUrl(GENERATED_MODEL_PUBLIC_URL); // Reset model URL
    setOriginalImageBlob(null);
    setLoadingMessage('');
    setIsGenerationFailed(false); // Clear failure status
  };

  const renderContent = () => {
    const backButtonClass = "p-2 mb-4 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition duration-150 shadow-md";

    switch (currentView) {
      case VIEWS.DRAWING:
        // Render the new full-featured drawing view
        return <DrawingView onExport={handleExport} isLoading={isLoading} />;

      case VIEWS.DETECTED:
        return (
          <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen font-sans flex flex-col items-center pt-8">
            <button onClick={handleBackToDrawing} className={backButtonClass}>
              ← Back to Drawing
            </button>
            {detectResult && detectResult.image && detectResult.objects ? (
                <DetectedImageDisplay 
                    base64Image={detectResult.image} 
                    detectedObjects={detectResult.objects} 
                    onGenerateAR={handleGenerateAR}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage} 
                    isGenerationFailed={isGenerationFailed}
                />
            ) : (
                <p className="text-center text-red-500">No detection results to display.</p>
            )}
            
          </div>
        );

      case VIEWS.AR_VIEWER:
        return (
          <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 flex flex-col items-center justify-center">
            
            {/* ARViewer uses the hardcoded model path */}
            <div className="flex-grow w-full h-full flex items-center justify-center">
              <div className="w-full h-full  overflow-hidden shadow-2xl border-4 border-indigo-200 bg-white/80 flex items-center justify-center">
                <ARViewer modelPath={GENERATED_MODEL_PUBLIC_URL} />
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-red-600">An unexpected error occurred.</div>;
    }
  };

  return (
    <div
      className={
        currentView !== VIEWS.DRAWING
          ? "max-w-4xl mx-auto full-viewport"
          : "drawing-bg full-viewport"
      }
      style={{ height: "100vh", overflow: "hidden" }}
    >
      {renderContent()}
    </div>
  );
}
