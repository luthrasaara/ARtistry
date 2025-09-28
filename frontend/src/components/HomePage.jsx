import Spline from "@splinetool/react-spline";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="homepage" style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      {/* Background Spline */}
      <Spline
        scene="https://my.spline.design/boxeshover-cBIyW5vFgBe9eavs24bxyNpK/"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      />

      {/* Foreground Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: "5rem" }}>
        <h1>Welcome to ARtistry</h1>

        <h1
          style={{
            margin: 0,
            fontSize: "2.5rem",
            fontWeight: 900,
            fontFamily: "'Baloo 2', cursive",
            background: "linear-gradient(to right, #2563eb, #9333ea)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "3rem",
          }}
        >
          Draw your world. Walk inside it.
        </h1>

        <Link
          to="/sketch"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "linear-gradient(to right, #2563eb, #9333ea)",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            borderRadius: "6px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
          }}
        >
          Go to Sketch Page
        </Link>
      </div>
    </div>
  );
}
