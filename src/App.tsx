import { useState } from "react";
import "./App.css";
import ArraySorter from "./components/ArraySorter";
import PhotoSorter from "./components/PhotoSorter";
import MathBenchmark from "./components/MathBenchmark";

type TabType = "array" | "photos" | "math";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("math");

  return (
    <div className="app">
      <header className="app-header">
        <h1>WASM Performance Showcase</h1>
        <p>
          Comparing Rust WebAssembly vs JavaScript across different algorithms
        </p>

        <nav className="tab-nav">
          <button
            className={`tab-button ${activeTab === "math" ? "active" : ""}`}
            onClick={() => setActiveTab("math")}
          >
            🧮 Math Benchmark
          </button>
          <button
            className={`tab-button ${activeTab === "photos" ? "active" : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            📸 Photo Sorter
          </button>
          <button
            className={`tab-button ${activeTab === "array" ? "active" : ""}`}
            onClick={() => setActiveTab("array")}
          >
            📊 Custom Arrays
          </button>
        </nav>
      </header>

      <main className="app-content">
        {activeTab === "math" && <MathBenchmark />}
        {activeTab === "photos" && <PhotoSorter />}
        {activeTab === "array" && <ArraySorter />}
      </main>
    </div>
  );
}

export default App;
