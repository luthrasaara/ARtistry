import React, { useState, useRef, useEffect, useCallback } from "react"; 
import { RefreshCw, Loader2, Zap, Palette, Eraser, Edit3, RotateCcw, Trash2, Download, Minus, Plus } from 'lucide-react'; 

const DETECT_API_URL = "http://localhost:8000/detect_objects/"; 
const AR_GENERATE_API_URL = "http://localhost:8000/image_to_ar/";

// This public URL must match the location where your FastAPI backend 
// places the final generated file in its publicly served directory.
const GENERATED_MODEL_PUBLIC_URL = "/generated_models/0/mesh.glb"; 

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
// Based on user provided SketchToolbar.jsx
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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-3 sm:p-6 mb-4 sm:mb-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/95">
      
      {/* Mobile Layout - Stacked */}
      <div className="flex flex-col gap-4 sm:hidden">
        {/* Color Section - Mobile */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl p-3 transition-all duration-300 hover:from-blue-100/80 hover:to-purple-100/80">
          <Palette className="w-4 h-4 text-gray-600 flex-shrink-0 animate-pulse" />
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="relative group">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-all duration-300 flex-shrink-0 hover:scale-110 hover:rotate-6"
                style={{ backgroundColor: color }}
              />
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-125"
                   style={{ backgroundColor: color }}></div>
            </div>
            <div className="flex gap-1">
              {commonColors.slice(0, 6).map((c, index) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 flex-shrink-0 shadow-sm hover:shadow-md"
                  style={{ 
                    backgroundColor: c,
                    animationDelay: `${index * 50}ms`
                  }}
                  disabled={exportButtonDisabled}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Brush Size Section - Mobile */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-xl p-3 transition-all duration-300 hover:from-green-100/80 hover:to-blue-100/80">
          <Edit3 className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:shadow-md"
              disabled={exportButtonDisabled}
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(e.target.value)}
              className="flex-1 accent-blue-500 transition-all duration-300"
              disabled={exportButtonDisabled}
            />
            <button 
              onClick={() => setLineWidth(Math.min(20, parseInt(lineWidth) + 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:shadow-md"
              disabled={exportButtonDisabled}
            >
              <Plus className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div 
                className="rounded-full border-2 border-gray-300 transition-all duration-300"
                style={{ 
                  width: `${Math.max(8, Math.min(20, lineWidth * 1.5))}px`, 
                  height: `${Math.max(8, Math.min(20, lineWidth * 1.5))}px`,
                  backgroundColor: isEraser ? '#ef4444' : color
                }}
              ></div>
              <span className="text-sm text-gray-600 min-w-[2.5rem] text-center">{lineWidth}px</span>
            </div>
          </div>
        </div>

        {/* Tools Section - Mobile (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-300 text-sm transform hover:scale-105 ${
              isEraser 
                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 shadow-red-100' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-blue-100'
            } hover:shadow-lg`}
            disabled={exportButtonDisabled}
          >
            {isEraser ? <Edit3 className="w-4 h-4 animate-bounce" /> : <Eraser className="w-4 h-4" />}
            {isEraser ? 'Pen' : 'Eraser'}
          </button>
          
          <button
            onClick={undo}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 text-sm transform hover:scale-105 hover:shadow-lg"
            disabled={exportButtonDisabled}
          >
            <RotateCcw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            Undo
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-xl border-2 border-red-200 transition-all duration-300 hover:border-red-300 text-sm transform hover:scale-105 hover:shadow-lg shadow-red-100"
            disabled={exportButtonDisabled}
          >
            <Trash2 className="w-4 h-4 hover:animate-bounce" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-300 text-sm transform hover:scale-105 ${
              exportButtonDisabled 
                ? 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200 hover:border-green-300 shadow-green-100'
            } hover:shadow-lg`}
            disabled={exportButtonDisabled}
          >
            <Download className={`w-4 h-4 ${exportButtonDisabled ? 'animate-spin' : 'hover:animate-bounce'}`} />
            {exportButtonText}
          </button>
        </div>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex flex-wrap items-center gap-4">
        {/* Color Section - Desktop */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl p-3 transition-all duration-300 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-lg">
          <Palette className="w-5 h-5 text-gray-600 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="relative group">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-all duration-300 hover:scale-110 hover:rotate-6"
                style={{ backgroundColor: color }}
                disabled={exportButtonDisabled}
              />
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-125"
                   style={{ backgroundColor: color }}></div>
            </div>
            <div className="flex gap-1">
              {commonColors.map((c, index) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-sm hover:shadow-md"
                  style={{ 
                    backgroundColor: c,
                    animationDelay: `${index * 50}ms`
                  }}
                  disabled={exportButtonDisabled}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Brush Size Section - Desktop */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-xl p-3 transition-all duration-300 hover:from-green-100/80 hover:to-blue-100/80 hover:shadow-lg">
          <Edit3 className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 hover:shadow-md"
              disabled={exportButtonDisabled}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(e.target.value)}
              className="w-24 accent-blue-500 transition-all duration-300"
              disabled={exportButtonDisabled}
            />
            <button 
              onClick={() => setLineWidth(Math.min(20, parseInt(lineWidth) + 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 hover:shadow-md"
              disabled={exportButtonDisabled}
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div 
                className="rounded-full border-2 border-gray-300 transition-all duration-300 shadow-sm"
                style={{ 
                  width: `${Math.max(10, Math.min(24, lineWidth * 1.5))}px`, 
                  height: `${Math.max(10, Math.min(24, lineWidth * 1.5))}px`,
                  backgroundColor: isEraser ? '#ef4444' : color
                }}
              ></div>
              <span className="text-sm text-gray-600 min-w-[2rem] text-center font-medium">{lineWidth}px</span>
            </div>
          </div>
        </div>

        {/* Tools Section - Desktop */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              isEraser 
                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 shadow-red-100' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-blue-100'
            } hover:shadow-lg`}
            disabled={exportButtonDisabled}
          >
            {isEraser ? <Edit3 className="w-4 h-4 animate-bounce" /> : <Eraser className="w-4 h-4" />}
            {isEraser ? 'Pen' : 'Eraser'}
          </button>
          
          <button
            onClick={undo}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
            disabled={exportButtonDisabled}
          >
            <RotateCcw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            Undo
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-xl border-2 border-red-200 transition-all duration-300 hover:border-red-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg shadow-red-100"
            disabled={exportButtonDisabled}
          >
            <Trash2 className="w-4 h-4 hover:animate-bounce" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              exportButtonDisabled 
                ? 'bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200 hover:border-green-300 shadow-green-100'
            } hover:shadow-lg`}
            disabled={exportButtonDisabled}
          >
            <Download className={`w-4 h-4 ${exportButtonDisabled ? 'animate-spin' : 'hover:animate-bounce'}`} />
            {exportButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};


// ===========================================
// 2. DRAWING VIEW (Replaces SketchCanvas for full drawing screen)
// ===========================================
// Based on user provided SketchCanvas.jsx
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 overflow-hidden">
      <div className="h-screen flex flex-col" ref={containerRef}>
        {/* Header - Integrated */}
        <div className="text-center py-4 sm:py-6 px-4 bg-white/60 backdrop-blur-md border-b border-white/20 flex-shrink-0">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-fade-in">
            Digital Sketch Canvas
          </h1>
          <p className="text-sm sm:text-base text-gray-600 animate-fade-in-delay">
            Create on an infinite grid canvas
          </p>
        </div>
        
        {/* Toolbar - Integrated */}
        <div className="px-4 pt-4 flex-shrink-0">
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
        </div>
        
        {/* Canvas Container - Full remaining space */}
        <div className="flex-1 px-4 pb-4 overflow-hidden min-h-0">
          <div className="h-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-2 sm:p-4 transition-all duration-500 hover:shadow-3xl">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`w-full h-full rounded-xl transition-all duration-300 ${
                isEraser ? 'cursor-cell' : 'cursor-crosshair'
              } ${drawing ? 'cursor-none' : ''} ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              style={{
                backgroundColor: "#fff",
                boxShadow: "inset 0 0 20px rgba(59, 130, 246, 0.1)",
                border: "2px solid rgba(59, 130, 246, 0.2)"
              }}
              // Mouse events
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              // Touch events
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />
          </div>
        </div>
        
        {/* Footer - Integrated */}
        <div className="text-center py-2 px-4 bg-white/60 backdrop-blur-md border-t border-white/20 flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-500">
            <span className="hidden sm:inline">Draw freely on the grid • {isEraser ? 'Erasing' : 'Drawing'} with </span>
            <span className="sm:hidden">{isEraser ? 'Erasing' : 'Drawing'} • </span>
            <span 
              className="inline-block w-3 h-3 rounded-full border border-gray-300 mx-1 animate-pulse"
              style={{ backgroundColor: isEraser ? '#ef4444' : color }}
            ></span>
            <span className="font-medium">{lineWidth}px {isEraser ? 'eraser' : 'pen'}</span>
            {isLoading && <span className="text-blue-500 ml-2 animate-pulse">| Detecting drawing...</span>}
          </p>
        </div>
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
            left: 'var(--mouse-x)', // Will be set by a global event listener if needed, but not implemented here.
            top: 'var(--mouse-y)'
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

// Define a constant for the desired scale factor
const MODEL_SCALE_MULTIPLIER = 3.0; 

const ARViewer = ({ modelPath }) => {
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
  const [currentModelPathDisplay, setCurrentModelPathDisplay] = useState(modelPath);

  // --- Dynamic Dependency Loading ---
  useEffect(() => {
    // Dynamically load the necessary Three.js scripts if they aren't already present
    const scripts = [
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js",
        "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
    ];
    
    scripts.forEach((src) => {
      const scriptId = `three-dep-${src.split('/').pop().split('.')[0]}`;
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }, []);

  // --- MODEL LOADING LOGIC ---
  const loadGlbModel = useCallback((path, scene) => {
    const THREE = window.THREE;
    const GLTFLoader = window.THREE?.GLTFLoader;

    if (!scene || !GLTFLoader || !THREE) {
      // Dependencies not ready, wait for initScene to catch this
      setLoading(false);
      return; 
    }

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
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (1.0 / maxDim) * MODEL_SCALE_MULTIPLIER; 
        newModel.scale.set(scale, scale, scale);
        
        // Set initial Z position
        newModel.position.set(0, 0, -2.0);
        
        scene.add(newModel);
        modelRef.current = newModel;
        
        setCurrentModelPathDisplay(path);
        setLoading(false);
      },
      (xhr) => {
        // Progress logger removed for cleanliness
      },
      (err) => {
        console.error("Error loading GLB model:", err);
        setError({ message: `Failed to load model from ${path}. Check the file path and CORS settings.` });
        setCurrentModelPathDisplay('Load Failed');
        setLoading(false);
      }
    );
  }, []);

  // --- SCENE INITIALIZATION ---
  const initScene = useCallback(() => {
    const THREE = window.THREE;
    const OrbitControls = window.THREE?.OrbitControls; 

    // 0. Dependency Check
    if (!THREE || !OrbitControls) {
      setError({
        message: "3D libraries are loading. Please wait a moment and try 'Restart Viewer'.",
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
    // Use canvas's actual client size for aspect ratio
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000); 
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // 1b. Add OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true; 
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 1;
    orbitControls.maxDistance = 10;
    
    // Set OrbitControls target and camera initial position
    orbitControls.target.set(0, 0, -1.5); 
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
        // Do not set loading false here, loading is set when the model loads
      }
    };
    
    // 4. Load initial model - Uses the prop provided by CreatePage
    loadGlbModel(modelPath, scene);

    // 5. Animation Loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controlsOrbitRef.current.update();
      renderer.render(scene, camera);
      return animationId;
    };
    
    // 6. Handle Resize
    const handleResize = () => {
      if (canvasRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = canvasRef.current.clientWidth / canvas.clientHeight;
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
    
  }, [loadGlbModel, modelPath]); // Re-run initScene if modelPath changes

  useEffect(() => {
    initScene();
  }, [initScene]);
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white p-4 font-sans">
      <h1 className="text-xl font-extrabold mb-2 text-center text-indigo-400">
        AR Viewer (Three.js)
      </h1>
      <p className="text-center text-xs mb-4 text-gray-400">
        Use mouse or touch gestures to rotate and zoom the model over your live camera feed.
      </p>

      {/* Control Panel */}
      <div className="flex justify-center space-x-4 mb-4 flex-wrap gap-2">
        <Button onClick={initScene} disabled={loading} className="bg-gray-700 hover:bg-gray-600">
            <RefreshCw className="w-4 h-4" />
            <span>{loading ? 'Initializing...' : 'Restart Viewer'}</span>
        </Button>
      </div>

      {/* Viewer Area */}
      <div className="relative w-full max-w-4xl max-h-[80vh] aspect-square bg-black rounded-xl overflow-hidden shadow-2xl min-h-[300px]">
        
        {/* Static Video element background */}
        <video ref={videoRef} autoPlay muted playsInline 
               className="absolute top-0 left-0 w-full h-full object-cover z-0" 
               style={{ opacity: 1 }}></video>
        
        {/* Canvas for Three.js rendering. Renders transparently on top */}
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
              <p className="text-lg font-bold text-red-100 mb-2">Error</p>
              <p className="text-sm text-red-100 mb-4">{error.message}</p>
              
              {error.scripts && (
                <>
                  <p className="text-xs text-red-200 mb-2">
                    Ensure these libraries are globally loaded in your HTML:
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
        
        {/* Bottom indicator */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-40 bg-gray-900/70 text-xs px-3 py-1 rounded-full shadow-lg border border-indigo-500/50">
            <span className="font-bold mr-1">Path:</span> 
            <code className="text-indigo-300 font-mono overflow-hidden whitespace-nowrap max-w-[200px] inline-block align-bottom">
                {currentModelPathDisplay}
            </code>
        </div>
      </div>
    </div>
  );
};


// ===========================================
// 4. DETECTED IMAGE DISPLAY
// ===========================================
const DetectedImageDisplay = ({ base64Image, detectedObjects, onGenerateAR, isLoading, loadingMessage, isGenerationFailed }) => {
  const canvasRef = useRef(null);

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
    ? 'bg-red-600 hover:bg-red-700' 
    : (isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700');
    
  const messageClassName = isGenerationFailed
      ? 'text-red-700 bg-red-50' 
      : 'text-indigo-700 bg-indigo-50';

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-md w-full max-w-sm mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">Detected Objects</h3>
      <div className="flex justify-center mb-4">
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="400"
          className="border-2 border-red-500 rounded-lg shadow-inner bg-white w-full h-auto max-w-full" 
        />
      </div>
      
      <button 
        onClick={onGenerateAR} 
        className={`w-full py-3 mt-4 text-white font-bold rounded-lg transition duration-300 shadow-md ${buttonClassName}`}
        // Button is disabled only when actively loading AND not in a failed state
        disabled={isLoading && !isGenerationFailed}
      >
        {buttonText}
      </button>
      {/* Display dynamic loading message/error */}
      {(isLoading || isGenerationFailed) && (
          <p className={`text-center text-sm font-medium mt-2 p-2 rounded-lg ${messageClassName} ${isLoading && 'animate-pulse'}`}>
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
    if (!originalImageBlob) {
        setLoadingMessage("Error: No original image to generate AR model from.");
        setIsGenerationFailed(true);
        return;
    }

    setIsLoading(true);
    setIsGenerationFailed(false); // Reset failure status for retry
    setLoadingMessage("Sending request to start AR generation job...");
    
    try {
      const formData = new FormData();
      formData.append("file", originalImageBlob, "user_drawing.png"); 

      // 1. Fire the initial long-running request (use await to capture immediate errors)
      const initialResponse = await fetch(AR_GENERATE_API_URL, {
        method: "POST",
        body: formData,
      });
      
      if (!initialResponse.ok) {
         const errorData = await initialResponse.json().catch(() => ({ detail: 'Non-JSON error response.' }));
         // Throw immediately if the server returns a non-2xx status (like 500)
         throw new Error(`Server failed to start AR job. Status: ${initialResponse.status} ${initialResponse.statusText}. Detail: ${errorData.detail || 'Check server logs for traceback.'}`);
      }

      // 2. Start polling for the generated file existence
      // If the initial request succeeded (or returned a 202 Accepted, which is treated as success here)
      // we proceed to poll for the output file.
      await pollForModel(GENERATED_MODEL_PUBLIC_URL, MAX_POLLING_RETRIES);

      // 3. Success: transition to AR viewer
      console.log("AR model generation success. Setting fixed URL:", GENERATED_MODEL_PUBLIC_URL);
      setModelUrl(GENERATED_MODEL_PUBLIC_URL);
      setCurrentView(VIEWS.AR_VIEWER);
      
      // Cleanup on success
      setLoadingMessage('');

    } catch (error) {
      // 4. Failure: Stay on DETECTED view, show error message
      console.error("Error generating AR model:", error);
      
      // Set the generation failure state
      setIsGenerationFailed(true);
      setLoadingMessage(`❌ Generation Failed: ${error.message}. Please check your server console (likely a resource or file permission issue) and click 'Retry Generation'.`);

    } finally {
      // 5. Stop the loading spinner (re-enables the button)
      setIsLoading(false);
    }
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
          <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen font-sans flex flex-col pt-8">
            <button onClick={handleBackToDrawing} className={backButtonClass}>
              ← Start Over
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">Your AR Model ✨</h2>
            {/* The ARViewer now takes the modelUrl state */}
            <div className="flex-grow min-h-[500px] border-2 border-indigo-300 rounded-xl shadow-lg">
              <ARViewer modelPath={modelUrl} />
            </div>
          </div>
        );

      default:
        return <div className="text-red-600">An unexpected error occurred.</div>;
    }
  };

  return (
    // Only apply max-width/margin/padding for non-drawing views
    <div className={currentView !== VIEWS.DRAWING ? "max-w-4xl mx-auto" : ""}>
      {renderContent()}
    </div>
  );
}
