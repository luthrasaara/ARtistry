import React, { useRef, useState, useEffect } from "react";
import SketchToolbar from "./SketchToolbar";

const SketchCanvas = ({ onExport }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = isEraser ? "#ffffff" : color; // use white for eraser
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawing) return;
    const canvas = canvasRef.current;
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
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = newHistory[newHistory.length - 1];
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const exportCanvas = () => {
    const dataURL = canvasRef.current.toDataURL("image/png");
    if (onExport) onExport(dataURL);
  };

  return (
    <div>
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
      />
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #000",
          marginTop: "10px",
          backgroundColor: "#fff",
          cursor: isEraser ? "cell" : "crosshair",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default SketchCanvas;
