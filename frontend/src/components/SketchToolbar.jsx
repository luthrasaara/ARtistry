import React from "react";
import { Palette, Eraser, Edit3, RotateCcw, Trash2, Download, Minus, Plus } from "lucide-react";

const SketchToolbar = ({ 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  undo, 
  clearCanvas, 
  isEraser, 
  exportCanvas, 
  setIsEraser 
}) => {
  const commonColors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
    "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB"
  ];

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
                />
              ))}
            </div>
          </div>
        </div>

        {/* Brush Size Section - Mobile */}
        <div className=" sm:hidden flex items-center gap-2 bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-xl p-3 transition-all duration-300 hover:from-green-100/80 hover:to-blue-100/80">
          <Edit3 className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:shadow-md"
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
            />
            <button 
              onClick={() => setLineWidth(Math.min(20, parseInt(lineWidth) + 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:shadow-md"
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
        <div className="sm:hidden grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-300 text-sm transform hover:scale-105 hover:-translate-y-1 ${
              isEraser 
                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 shadow-red-100' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-blue-100'
            } hover:shadow-lg`}
          >
            {isEraser ? <Edit3 className="w-4 h-4 animate-bounce" /> : <Eraser className="w-4 h-4" />}
            {isEraser ? 'Pen' : 'Eraser'}
          </button>
          
          <button
            onClick={undo}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 text-sm transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
          >
            <RotateCcw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            Undo
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-xl border-2 border-red-200 transition-all duration-300 hover:border-red-300 text-sm transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg shadow-red-100"
          >
            <Trash2 className="w-4 h-4 hover:animate-bounce" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded-xl border-2 border-green-200 transition-all duration-300 hover:border-green-300 text-sm transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg shadow-green-100"
          >
            <Download className="w-4 h-4 hover:animate-bounce" />
            Export
          </button>
        </div>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="sm:hidden hidden sm:flex flex-wrap items-center gap-4">
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
                />
              ))}
            </div>
          </div>
        </div>

        {/* Brush Size Section - Desktop */}
        <div className="hidden background-color:red flex items-center gap-3 bg-gradient-to-r from-green-50/80 to-blue-50/80 rounded-xl p-3 transition-all duration-300 hover:from-green-100/80 hover:to-blue-100/80 hover:shadow-lg">
          <Edit3 className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 hover:shadow-md"
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
            />
            <button 
              onClick={() => setLineWidth(Math.min(20, parseInt(lineWidth) + 1))}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white hover:scale-110 flex items-center justify-center transition-all duration-300 hover:shadow-md"
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
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              isEraser 
                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-700 hover:from-red-100 hover:to-pink-100 shadow-red-100' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-blue-100'
            } hover:shadow-lg`}
          >
            {isEraser ? <Edit3 className="w-4 h-4 animate-bounce" /> : <Eraser className="w-4 h-4" />}
            {isEraser ? 'Pen' : 'Eraser'}
          </button>
          
          <button
            onClick={undo}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
          >
            <RotateCcw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            Undo
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 rounded-xl border-2 border-red-200 transition-all duration-300 hover:border-red-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg shadow-red-100"
          >
            <Trash2 className="w-4 h-4 hover:animate-bounce" />
            Clear
          </button>
          
          <button
            onClick={exportCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded-xl border-2 border-green-200 transition-all duration-300 hover:border-green-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg shadow-green-100"
          >
            <Download className="w-4 h-4 hover:animate-bounce" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default SketchToolbar;