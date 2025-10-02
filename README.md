# AR Drawing to 3D Mesh App

This project was developed as part of the **Technova Hackathon**.  
It is a collaborative effort, built as a team project.

This app allows users to draw 2D sketches and convert them into interactive 3D meshes that can be viewed in augmented reality. It leverages the **[Stable-Fast-3D](https://huggingface.co/CompVis/stable-fast-3d)** model for converting 2D images into 3D mesh representations.

## Features

- Draw sketches directly on a web canvas.
- Convert 2D sketches into 3D `.glb` meshes.
- View generated 3D models in AR using a simple viewer.
- Backend API handles model inference and mesh generation.

## Tech Stack

- **Frontend:** React, Tailwind CSS  
- **Backend:** FastAPI, Python  
- **3D Conversion Model:** [Stable-Fast-3D](https://huggingface.co/CompVis/stable-fast-3d)  
- **3D Viewer:** Three.js / `<model-viewer>`  

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <repo-folder>
