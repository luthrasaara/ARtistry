import React from "react";
import SketchCanvas from "./components/SketchCanvas";

export default function CreatePage() {
  const handleExport = (imageData) => {
    console.log("Canvas exported:", imageData);
    // send to backend API for 3D generation
  };

  return (
    <div>
      <h1>Draw Your Sketch</h1>
      <SketchCanvas onExport={handleExport} />
    </div>
  );
}
