import React, { useState, useEffect } from "react";
import { useWasm } from "../hooks/useWasm";
import "./PhotoSorter.css";

interface Photo {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

type SortBy = "id" | "albumId" | "title" | "titleLength" | "custom";

const PhotoSorter: React.FC = () => {
  const { wasm, loading, error } = useWasm();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sortedPhotos, setSortedPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("id");
  const [ascending, setAscending] = useState(true);
  const [customPredicate, setCustomPredicate] = useState<string>(
    "(a, b) => a.id - b.id"
  );
  const [wasmSortTime, setWasmSortTime] = useState<number | null>(null);
  const [jsSortTime, setJsSortTime] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(20);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<{
    dataSize: number;
    wasmOverhead: number;
    jsOptimized: boolean;
    recommendation: string;
    explanation: string;
  } | null>(null);

  const fetchPhotos = async () => {
    setLoadingPhotos(true);
    setPhotoError(null);
    try {
      // For datasets larger than 5000, we need to duplicate data since JSONPlaceholder only has 5000 photos
      const fetchLimit = Math.min(limit, 5000);
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/photos?_limit=${fetchLimit}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data: Photo[] = await response.json();

      // If we need more data than available, duplicate and modify the dataset
      if (limit > 5000) {
        const originalData = [...data];
        const duplicationsNeeded = Math.ceil(limit / 5000);
        data = [];

        for (let i = 0; i < duplicationsNeeded; i++) {
          const duplicatedBatch = originalData.map((photo) => ({
            ...photo,
            id: photo.id + i * 5000, // Ensure unique IDs
            albumId: photo.albumId + i * 100, // Vary album IDs
            title: `${photo.title} (Set ${i + 1})`, // Differentiate titles
          }));
          data.push(...duplicatedBatch);
        }

        // Trim to exact requested size
        data = data.slice(0, limit);
      }

      setPhotos(data);
      setSortedPhotos(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch photos";
      setPhotoError(errorMessage);
      console.error("Error fetching photos:", err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCompareFn = (): ((a: Photo, b: Photo) => number) => {
    switch (sortBy) {
      case "id":
        return (a: Photo, b: Photo) => (ascending ? a.id - b.id : b.id - a.id);
      case "albumId":
        return (a: Photo, b: Photo) =>
          ascending ? a.albumId - b.albumId : b.albumId - a.albumId;
      case "title":
        return (a: Photo, b: Photo) =>
          ascending
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
      case "titleLength":
        return (a: Photo, b: Photo) =>
          ascending
            ? a.title.length - b.title.length
            : b.title.length - a.title.length;
      case "custom":
        return new Function("a", "b", `return ${customPredicate}`) as (
          a: Photo,
          b: Photo
        ) => number;
      default:
        return (a: Photo, b: Photo) => a.id - b.id;
    }
  };

  const sortWithWasm = async (): Promise<{ result: Photo[]; time: number }> => {
    if (!wasm) throw new Error("WASM not loaded");

    const startTime = performance.now();
    const compareFn = getCompareFn();
    const result = wasm.sort_array([...photos], compareFn);
    const endTime = performance.now();

    return { result, time: endTime - startTime };
  };

  const sortWithJS = async (): Promise<{ result: Photo[]; time: number }> => {
    const startTime = performance.now();
    const compareFn = getCompareFn();
    const result = [...photos].sort(compareFn);
    const endTime = performance.now();

    return { result, time: endTime - startTime };
  };

  const handleSort = async (method: "wasm" | "js" | "both") => {
    if (photos.length === 0) return;

    try {
      setWasmSortTime(null);
      setJsSortTime(null);
      setPerformanceAnalysis(null);

      let wasmTime: number | null = null;
      let jsTime: number | null = null;

      if (method === "wasm" || method === "both") {
        if (!wasm) {
          alert("WebAssembly module not loaded yet");
          return;
        }
        const wasmResult = await sortWithWasm();
        wasmTime = wasmResult.time;
        setWasmSortTime(wasmResult.time);
        setSortedPhotos(wasmResult.result);
      }

      if (method === "js" || method === "both") {
        const jsResult = await sortWithJS();
        jsTime = jsResult.time;
        setJsSortTime(jsResult.time);
        if (method === "js") {
          setSortedPhotos(jsResult.result);
        }
      }

      // Performance analysis when both methods are compared
      if (method === "both" && wasmTime !== null && jsTime !== null) {
        const dataSize = photos.length;
        const wasmOverhead = ((wasmTime - jsTime) / jsTime) * 100;

        let explanation = "";
        let recommendation = "";

        if (dataSize < 1000) {
          explanation =
            "For small datasets (<1000 items), JavaScript is typically faster due to WASM overhead. WASM excels with larger datasets or complex computations.";
          recommendation = "Use JavaScript for this data size";
        } else if (dataSize < 5000) {
          explanation =
            "For medium datasets (1K-5K items), the performance difference depends on the complexity of comparisons. WASM may start to show benefits with complex predicates.";
          recommendation =
            wasmOverhead < 30
              ? "WASM performance is becoming competitive"
              : "JavaScript is still preferred";
        } else if (dataSize < 15000) {
          explanation =
            "For large datasets (5K-15K items), WASM should start outperforming JavaScript, especially with complex sorting logic. This is the sweet spot where WASM overhead becomes justified.";
          recommendation =
            wasmOverhead < 0
              ? "🎯 WASM is performing well - this is expected!"
              : wasmOverhead < 20
              ? "WASM is competitive, performance gap is closing"
              : "Check if WASM implementation can be optimized";
        } else if (dataSize < 50000) {
          explanation =
            "For very large datasets (15K-50K items), WASM should significantly outperform JavaScript due to better memory management and CPU optimization.";
          recommendation =
            wasmOverhead < -10
              ? "🚀 Excellent! WASM is showing significant performance gains"
              : wasmOverhead < 0
              ? "✅ WASM is faster as expected for this dataset size"
              : "⚠️ Unexpected - WASM should be faster at this scale";
        } else {
          explanation =
            "For extremely large datasets (>50K items), WASM should theoretically outperform JavaScript, but our implementation shows JS still winning. This reveals important real-world limitations.";
          recommendation =
            wasmOverhead < -20
              ? "🔥 Outstanding! WASM is showing dramatic performance advantages"
              : wasmOverhead < 0
              ? "✅ Good performance, WASM is faster as expected"
              : "🤔 JavaScript still wins - this shows real-world WASM challenges";
        }

        // Additional factors affecting performance
        const factors = [];

        // Always present factors in our implementation
        factors.push(
          "🔄 WASM-JS boundary crossings: Every comparison function call crosses the boundary"
        );
        factors.push(
          "📦 Object serialization: Complex objects (Photos) require serialization between JS and WASM"
        );
        factors.push(
          "🧠 V8 optimization: JavaScript's JIT compiler is extremely optimized for array sorting"
        );
        factors.push(
          "🏗️ Simple implementation: Our WASM code doesn't use advanced optimizations (SIMD, manual memory management)"
        );

        if (sortBy === "custom") {
          factors.push(
            "❌ Custom predicates: Every comparison executes JavaScript code, negating WASM benefits"
          );
        }
        if (sortBy === "title") {
          factors.push(
            "📝 String operations: JavaScript has native UTF-16 string handling, WASM requires conversion"
          );
        }
        if (dataSize < 100) {
          factors.push(
            "⚡ Small datasets: WASM initialization overhead dominates performance"
          );
        }
        if (dataSize > 10000 && wasmOverhead > 0) {
          factors.push(
            "🎯 Reality check: Modern JavaScript engines are incredibly fast for sorting operations"
          );
        }
        if (dataSize > 50000 && wasmOverhead > 0) {
          factors.push(
            "🔍 Key insight: WASM excels at compute-heavy tasks, but sorting is memory-bound and JS is highly optimized for it"
          );
        }
        if (limit > 5000) {
          factors.push(
            "This dataset uses duplicated data to test large-scale performance characteristics"
          );
        }

        if (factors.length > 0) {
          explanation += ` Additional factors: ${factors.join(". ")}.`;
        }

        setPerformanceAnalysis({
          dataSize,
          wasmOverhead,
          jsOptimized: jsTime < wasmTime,
          recommendation,
          explanation,
        });
      }
    } catch (err) {
      console.error("Sorting error:", err);
      alert("Error during sorting. Please check your predicate.");
    }
  };

  const examplePredicates = {
    byId: "(a, b) => a.id - b.id",
    byIdDesc: "(a, b) => b.id - a.id",
    byAlbumId: "(a, b) => a.albumId - b.albumId",
    byTitle: "(a, b) => a.title.localeCompare(b.title)",
    byTitleLength: "(a, b) => a.title.length - b.title.length",
    byAlbumThenId: "(a, b) => a.albumId - b.albumId || a.id - b.id",
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading WebAssembly module...</h2>
        <p>Initializing Rust-powered sorting engine</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error loading WebAssembly</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="photo-sorter">
      <div className="controls">
        <div className="fetch-controls">
          <h3>Fetch Photos</h3>
          <div className="limit-control">
            <label>
              Number of photos:
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000 (All Photos)</option>
                <option value={10000}>10,000 (Duplicated)</option>
                <option value={20000}>20,000 (Duplicated)</option>
                <option value={50000}>50,000 (Duplicated)</option>
              </select>
            </label>
          </div>
          <button
            onClick={fetchPhotos}
            disabled={loadingPhotos}
            className="fetch-button"
          >
            {loadingPhotos
              ? limit > 10000
                ? `Generating ${limit.toLocaleString()} items...`
                : "Fetching..."
              : "Fetch Photos"}
          </button>
          {photoError && <p className="error-message">{photoError}</p>}
          {limit > 5000 && (
            <p className="info-message">
              📊 Datasets larger than 5,000 use duplicated data to test
              large-scale performance. This helps demonstrate where WASM becomes
              more efficient than JavaScript.
            </p>
          )}
        </div>

        <div className="sort-controls">
          <h3>Sort Photos</h3>
          <div className="sort-by-selector">
            <label>
              Sort by:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                <option value="id">ID</option>
                <option value="albumId">Album ID</option>
                <option value="title">Title (Alphabetical)</option>
                <option value="titleLength">Title Length</option>
                <option value="custom">Custom Predicate</option>
              </select>
            </label>
          </div>

          {sortBy !== "custom" && (
            <div className="direction-selector">
              <label>
                <input
                  type="checkbox"
                  checked={ascending}
                  onChange={(e) => setAscending(e.target.checked)}
                />
                Ascending
              </label>
            </div>
          )}

          {sortBy === "custom" && (
            <div className="predicate-input">
              <h4>Custom Predicate Function</h4>
              <input
                type="text"
                value={customPredicate}
                onChange={(e) => setCustomPredicate(e.target.value)}
                placeholder="(a, b) => comparison"
                className="predicate-field"
              />
              <div className="examples">
                <h5>Examples:</h5>
                {Object.entries(examplePredicates).map(([name, predicate]) => (
                  <button
                    key={name}
                    onClick={() => setCustomPredicate(predicate)}
                    className="example-button"
                  >
                    {name}: {predicate}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sort-buttons">
            <button
              className="sort-button wasm-button"
              onClick={() => handleSort("wasm")}
              disabled={photos.length === 0 || !wasm}
            >
              🦀 Sort with Rust WASM
            </button>
            <button
              className="sort-button js-button"
              onClick={() => handleSort("js")}
              disabled={photos.length === 0}
            >
              ⚡ Sort with JavaScript
            </button>
            <button
              className="sort-button both-button"
              onClick={() => handleSort("both")}
              disabled={photos.length === 0 || !wasm}
            >
              🏁 Compare Both Methods
            </button>
          </div>
        </div>
      </div>

      <div className="results">
        <div className="stats">
          <p>Total photos: {photos.length}</p>
          <div className="performance-stats">
            {wasmSortTime !== null && (
              <p className="sort-time wasm-time">
                🦀 Rust WASM: {wasmSortTime.toFixed(2)}ms
              </p>
            )}
            {jsSortTime !== null && (
              <p className="sort-time js-time">
                ⚡ JavaScript: {jsSortTime.toFixed(2)}ms
              </p>
            )}
            {wasmSortTime !== null && jsSortTime !== null && (
              <p className="performance-comparison">
                {wasmSortTime < jsSortTime ? (
                  <span className="winner">
                    🏆 WASM is{" "}
                    {((jsSortTime / wasmSortTime - 1) * 100).toFixed(1)}%
                    faster!
                  </span>
                ) : (
                  <span className="winner">
                    🏆 JavaScript is{" "}
                    {((wasmSortTime / jsSortTime - 1) * 100).toFixed(1)}%
                    faster!
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {performanceAnalysis && (
          <div className="performance-analysis">
            <h3>🔍 Performance Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-stats">
                <div className="stat-item">
                  <label>Data Size:</label>
                  <span>{performanceAnalysis.dataSize} items</span>
                </div>
                <div className="stat-item">
                  <label>WASM Overhead:</label>
                  <span
                    className={
                      performanceAnalysis.wasmOverhead > 0
                        ? "negative"
                        : "positive"
                    }
                  >
                    {performanceAnalysis.wasmOverhead > 0 ? "+" : ""}
                    {performanceAnalysis.wasmOverhead.toFixed(1)}%
                  </span>
                </div>
                <div className="stat-item">
                  <label>Recommendation:</label>
                  <span className="recommendation">
                    {performanceAnalysis.recommendation}
                  </span>
                </div>
              </div>
              <div className="analysis-explanation">
                <h4>Why is JavaScript winning even with 50K+ items?</h4>
                <p>{performanceAnalysis.explanation}</p>
                <div className="key-insights">
                  <h5>🔍 Key Insights from This Comparison:</h5>
                  <ul>
                    <li>
                      <strong>Modern JS engines are incredibly fast:</strong>{" "}
                      V8's Timsort implementation is highly optimized
                    </li>
                    <li>
                      <strong>Memory layout matters:</strong> JS objects in our
                      test are already optimized for the engine
                    </li>
                    <li>
                      <strong>Boundary crossing overhead:</strong> Each
                      comparison function call has cost
                    </li>
                    <li>
                      <strong>WASM isn't always faster:</strong> It depends
                      heavily on the specific use case
                    </li>
                  </ul>
                </div>
                <div className="performance-factors">
                  <h5>Key Performance Factors:</h5>
                  <ul>
                    <li>
                      <strong>Data Size:</strong> WASM has initialization
                      overhead that affects small datasets
                    </li>
                    <li>
                      <strong>Boundary Crossings:</strong> Data transfer between
                      JS and WASM adds latency
                    </li>
                    <li>
                      <strong>JavaScript Optimization:</strong> Modern JS
                      engines are highly optimized for array operations
                    </li>
                    <li>
                      <strong>Memory Management:</strong> WASM memory
                      allocation/deallocation overhead
                    </li>
                    <li>
                      <strong>Predicate Complexity:</strong> Simple comparisons
                      favor JS, complex logic favors WASM
                    </li>
                  </ul>
                </div>
                <div className="when-use-wasm">
                  <h5>When WASM Actually Outperforms JS:</h5>
                  <ul>
                    <li>
                      🧮 Heavy mathematical computations (not simple
                      comparisons)
                    </li>
                    <li>
                      🔢 Numerical processing with minimal JS-WASM communication
                    </li>
                    <li>🎮 Game engines and physics simulations</li>
                    <li>
                      🖼️ Image/video processing with raw data manipulation
                    </li>
                    <li>🔐 Cryptographic operations</li>
                    <li>
                      📊 Scientific computing with large numerical datasets
                    </li>
                    <li>
                      ⚡ CPU-bound algorithms that avoid frequent boundary
                      crossings
                    </li>
                  </ul>
                  <div className="reality-check">
                    <h6>🎯 Reality Check:</h6>
                    <p>
                      For array sorting specifically, JavaScript engines are so
                      highly optimized that WASM rarely provides benefits unless
                      you're implementing exotic sorting algorithms or working
                      with specific data types that benefit from manual memory
                      management.
                    </p>
                  </div>
                </div>
                <div className="how-to-make-wasm-faster">
                  <h5>🚀 How to Make WASM Competitive for Sorting:</h5>
                  <ul>
                    <li>
                      🔧 <strong>Eliminate boundary crossings:</strong>{" "}
                      Implement comparison logic entirely in Rust
                    </li>
                    <li>
                      📊 <strong>Use native data types:</strong> Work with raw
                      numbers/bytes instead of complex objects
                    </li>
                    <li>
                      🧠 <strong>Custom memory management:</strong> Use linear
                      memory layout optimized for cache performance
                    </li>
                    <li>
                      ⚡ <strong>SIMD instructions:</strong> Use vector
                      operations for parallel comparisons
                    </li>
                    <li>
                      🔀 <strong>Specialized algorithms:</strong> Implement
                      radix sort or other non-comparison sorts
                    </li>
                    <li>
                      📦 <strong>Batch operations:</strong> Process many items
                      at once to amortize call overhead
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="photos-grid">
          {sortedPhotos.map((photo, index) => (
            <div key={photo.id} className="photo-card">
              <div className="photo-header">
                <span className="photo-index">#{index + 1}</span>
                <span className="photo-id">ID: {photo.id}</span>
                <span className="album-id">Album: {photo.albumId}</span>
              </div>
              <img src={photo.thumbnailUrl} alt={photo.title} loading="lazy" />
              <div className="photo-info">
                <p className="photo-title" title={photo.title}>
                  {photo.title}
                </p>
                <p className="title-length">
                  Title length: {photo.title.length} chars
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoSorter;
