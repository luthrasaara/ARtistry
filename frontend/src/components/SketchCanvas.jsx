import React, { useRef, useState, useEffect } from "react";
import SketchToolbar from "./SketchToolbar";

const SketchCanvas = ({ onExport, isLoading }) => { // Added isLoading prop
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Create grid pattern
  const drawGrid = (ctx, width, height) => {
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
  };

  // Full screen canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Account for toolbar and padding
      const toolbarHeight = window.innerWidth < 640 ? 220 : 120; // Mobile vs desktop toolbar height
      const padding = window.innerWidth < 640 ? 20 : 40;
      
      const availableWidth = viewportWidth - padding;
      const availableHeight = viewportHeight - toolbarHeight - padding;
      
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
  }, [canvasSize]);

  // Handle both mouse and touch events
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
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
        // Use nativeEvent.offsetX/Y for mouse events, which are relative to the element
        x: e.nativeEvent.offsetX * scaleX,
        y: e.nativeEvent.offsetY * scaleY
      };
    }
  };

  const startDrawing = (e) => {
    // Only start drawing if not already loading a model
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

    const ctx = canvasRef.current.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Redraw the entire canvas background and grid
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
      
      // Draw the previous state from history
      ctx.drawImage(img, 0, 0);
    };
    img.src = newHistory[newHistory.length - 1];
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  /**
   * FIX: Uses canvas.toBlob() to correctly generate a Blob object
   * that can be appended to FormData for file upload.
   */
  const exportCanvas = () => {
    if (onExport && canvasRef.current) {
      // canvas.toBlob() is asynchronous and passes the resulting Blob to the callback
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
        {/* Header */}
        <div className="text-center py-4 sm:py-6 px-4 bg-white/60 backdrop-blur-md border-b border-white/20">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 animate-fade-in">
            Digital Sketch Canvas
          </h1>
          <p className="text-sm sm:text-base text-gray-600 animate-fade-in-delay">
            Create on an infinite grid canvas
          </p>
        </div>
        
        {/* Toolbar */}
        <div className="px-4 pt-4">
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
            // Pass loading state to toolbar to disable export button
            isLoading={isLoading} 
          />
        </div>
        
        {/* Canvas Container - Full remaining space */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
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
        
        {/* Footer */}
        <div className="text-center py-2 px-4 bg-white/60 backdrop-blur-md border-t border-white/20">
          <p className="text-xs sm:text-sm text-gray-500">
            <span className="hidden sm:inline">Draw freely on the grid • {isEraser ? 'Erasing' : 'Drawing'} with </span>
            <span className="sm:hidden">{isEraser ? 'Erasing' : 'Drawing'} • </span>
            <span 
              className="inline-block w-3 h-3 rounded-full border border-gray-300 mx-1 animate-pulse"
              style={{ backgroundColor: isEraser ? '#ef4444' : color }}
            ></span>
            <span className="font-medium">{lineWidth}px {isEraser ? 'eraser' : 'pen'}</span>
            {isLoading && <span className="text-blue-500 ml-2 animate-pulse">| Generating AR...</span>}
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
            left: '50%',
            top: '50%'
          }}
        />
      )}

      <style jsx>{`
        /* ... existing styles ... */
      `}</style>
    </div>
  );
};

export default SketchCanvas;