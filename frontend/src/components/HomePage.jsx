// src/HomePage.js
import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="homepage">

      <iframe
        src="https://my.spline.design/abstractnirvana-2ZttYICS6dz9kPjwua8hL7JS/"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%", 
          zIndex: -1,
        }}
      ></iframe>
    

    <h1
      style={{
        margin: 0,
        fontSize: "5rem",
        fontWeight: 900, // use 900 instead of 2000 (CSS max is 900)
        fontFamily: "'Baloo 2', cursive",
        background: "linear-gradient(to right, #60d2d8ff, #bb70d6ff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "2rem",
      }}
    >
      Welcome to ARtistry
    </h1>

    <h1
      style={{
        margin: 0,
        fontSize: "2rem",
        fontWeight: 500, // use 900 instead of 2000 (CSS max is 900)
        fontFamily: "'Baloo 2', cursive",
        background: "#c76ea8ff",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "3rem",
      }}
    >
      From Sketch to Space
    </h1>

       <Link to="/sketch" className="link-btn">
  Go to Sketch Page
</Link>

      
    </div>
  );
}

export default HomePage;