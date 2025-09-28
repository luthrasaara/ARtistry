import React, { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, Zap, Palette, Eraser, Edit3, RotateCcw, Trash2, Download } from "lucide-react";
import ARViewer from "./components/ARViewer";

const DETECT_API_URL = "http://localhost:8000/detect_objects/";
const GENERATED_MODEL_PUBLIC_URL = "./generated_models/heart.glb";

const POLLING_INTERVAL_MS = 10000;
const MAX_POLLING_RETRIES = 25;

const VIEWS = {
  DRAWING: "drawing",
  DETECTED: "detected",
  AR_VIEWER: "ar_viewer",
};

// ============================
// Sketch Toolbar Component
// ============================
const SketchToolbar = ({
  color,
  setColor,
  lineWidth,
  setLineWidth,
  undo,
  clearCanvas,
  isEraser,
  setIsEraser,
  exportCanvas,
  isLoading,
}) => {
  const commonColors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"];
  const exportText = isLoading ? "Processing..." : "Detect Drawing";

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border border-gray-200/70">
      
      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
          disabled={isLoading}
        />
        {commonColors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === c ? "border-indigo-500 shadow-lg" : "border-gray-200"}`}
            style={{ backgroundColor: c }}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Brush Size */}
      <div className="flex items-center gap-2 ml-4">
        <Edit3 className="w-5 h-5 text-gray-600" />
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="accent-indigo-500"
          disabled={isLoading}
        />
        <span className="text-xs text-gray-600">{lineWidth}px</span>
      </div>

      {/* Tools */}
      <button
        onClick={() => setIsEraser(!isEraser)}
        className={`rounded-full p-2 transition-all ${isEraser ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-700"} hover:scale-110`}
        disabled={isLoading}
      >
        {isEraser ? <Edit3 className="w-5 h-5" /> : <Eraser className="w-5 h-5" />}
      </button>

      <button onClick={undo} className="rounded-full p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-110 transition-all" disabled={isLoading}>
        <RotateCcw className="w-5 h-5" />
      </button>

      <button onClick={clearCanvas} className="rounded-full p-2 bg-red-100 text-red-700 hover:bg-red-200 hover:scale-110 transition-all" disabled={isLoading}>
        <Trash2 className="w-5 h-5" />
      </button>

      <button
        onClick={exportCanvas}
        className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-bold hover:scale-105 transition-transform flex items-center gap-2"
        disabled={isLoading}
      >
        <Download className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        {exportText}
      </button>
    </div>
  );
};

// ============================
// Drawing View Component
// ============================
const DrawingView = ({ onExport, isLoading }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(6);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  // Grid drawing
  const drawGrid = useCallback((ctx, width, height) => {
    const gridSize = 20;
    ctx.strokeStyle = "rgba(59,130,246,0.15)";
    ctx.lineWidth = 0.5;

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

    ctx.strokeStyle = "rgba(59,130,246,0.25)";
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

  useEffect(() => {
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCanvasSize({ width: rect.width * 0.9, height: Math.max(300, window.innerHeight * 0.6) });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    if (history.length > 0) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = history[history.length - 1];
    }
  }, [canvasSize, history, drawGrid]);

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    } else {
      return { x: e.nativeEvent.offsetX * scaleX, y: e.nativeEvent.offsetY * scaleY };
    }
  };

  const startDrawing = (e) => {
    if (isLoading) return;
    const pos = getEventPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const pos = getEventPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = isEraser ? "#fff" : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";

    const snapshot = canvas.toDataURL();
    setHistory((prev) => [...prev, snapshot]);
    setDrawing(false);
  };

  const undo = () => {
    if (history.length <= 1) {
      clearCanvas();
      return;
    }
    setHistory(history.slice(0, -1));
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const exportCanvas = () => {
    if (canvasRef.current && onExport) {
      canvasRef.current.toBlob((blob) => {
        if (blob) onExport(blob);
      }, "image/png");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Title */}
      <div className="w-full flex flex-col items-center pt-12 pb-2">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg tracking-tight select-none">
          ARtistry
        </h1>
        <p className="text-gray-500 mt-1 text-center">Create, sketch, and bring your art to AR life!</p>
      </div>

      {/* Toolbar */}
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

      {/* Canvas */}
      <div className="flex justify-center items-center h-[70vh] pt-32" ref={containerRef}>
        <div className="relative shadow-2xl rounded-3xl border-4 border-indigo-100 bg-white/90 overflow-hidden flex justify-center items-center">
          <canvas
            ref={canvasRef}
            className={`rounded-2xl w-[90vw] max-w-[700px] h-[60vh] max-h-[600px] ${isEraser ? "cursor-cell" : "cursor-crosshair"} ${drawing ? "cursor-none" : ""}`}
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
      </div>

      {/* Footer */}
      <div className="text-center py-2 px-4 bg-white/60 backdrop-blur-md border-t border-white/20 fixed bottom-0 left-0 w-full z-20">
        <p className="text-xs sm:text-sm text-gray-500">
          <span>{isEraser ? "Erasing" : "Drawing"} • </span>
          <span className="inline-block w-4 h-4 rounded-full border-2 mx-1" style={{ backgroundColor: isEraser ? "#ef4444" : color }}></span>
          <span className="font-medium">{lineWidth}px {isEraser ? "eraser" : "pen"}</span>
          {isLoading && <span className="text-blue-500 ml-2 animate-pulse">| Generating AR...</span>}
        </p>
      </div>

      {/* Custom cursor */}
      {drawing && (
        <div
          className="fixed pointer-events-none z-50 rounded-full border-2 border-indigo-400 mix-blend-difference transition-all duration-100"
          style={{
            width: `${lineWidth * 2}px`,
            height: `${lineWidth * 2}px`,
            backgroundColor: isEraser ? "rgba(239,68,68,0.5)" : `${color}40`,
            transform: "translate(-50%, -50%)",
            left: "var(--mouse-x, 50%)",
            top: "var(--mouse-y, 50%)",
          }}
        />
      )}
    </div>
  );
};

// ============================
// Detected Image Display Component
// ============================
const DetectedImageDisplay = ({ base64Image, detectedObjects, onGenerateAR, isLoading, loadingMessage, isGenerationFailed }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!base64Image || !detectedObjects || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = `data:image/png;base64,${base64Image}`;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 3;
      ctx.font = "18px Roboto";
      ctx.fillStyle = "#4f46e5";

      detectedObjects.forEach((obj) => {
        const { bbox, label } = obj;
        ctx.strokeRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
        ctx.fillText(label, bbox[0] + 4, bbox[1] + 20);
      });
    };
  }, [base64Image, detectedObjects]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl" />
      <button
        className="mt-6 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
        onClick={onGenerateAR}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
        {loadingMessage || "Generate AR Model"}
      </button>
      {isGenerationFailed && <p className="mt-2 text-red-600 font-medium">AR Generation failed. Please try again.</p>}
    </div>
  );
};

// ============================
// AR Viewer Component Wrapper
// ============================
const ARViewerPage = ({ modelUrl }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-24">
      <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent mb-4">
        AR Model Viewer
      </h2>
      <div className="w-[90vw] max-w-3xl h-[60vh] rounded-2xl shadow-2xl overflow-hidden border border-indigo-100">
        <ARViewer modelUrl={modelUrl} />
      </div>
    </div>
  );
};

export { DrawingView, DetectedImageDisplay, ARViewerPage };
