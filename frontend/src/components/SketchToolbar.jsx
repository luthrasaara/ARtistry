import React from "react";

const SketchToolbar = ({ color, setColor, lineWidth, setLineWidth, undo, clearCanvas, exportCanvas }) => {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input
        type="range"
        min="1"
        max="20"
        value={lineWidth}
        onChange={(e) => setLineWidth(e.target.value)}
      />
      <button onClick={undo}>Undo</button>
      <button onClick={clearCanvas}>Clear</button>
      <button onClick={exportCanvas}>Export</button>
    </div>
  );
};

export default SketchToolbar;
