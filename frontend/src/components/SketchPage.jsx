import React from "react";
import { Link } from "react-router-dom";
import "./SketchPage.css";

function SketchPage() {
  return (
    <div className="sketchpage">
      {/* Home Button */}
      <Link to="/" className="home-btn" title="Go Home">
        <img src="home.png" alt="Home" className="home-icon" />
      </Link>
      

      {/* Placeholder content */}
      <h1 className="sketch-title">This is the Sketch Page</h1>
      <p className="sketch-subtitle">Your canvas will go here 🎨</p>
    </div>
  );
}

export default SketchPage;
