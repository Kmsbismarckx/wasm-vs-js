import React, { useState } from "react";
import { useWasm } from "../hooks/useWasm";
import "./MathBenchmark.css";

type BenchmarkType =
  | "montecarlo"
  | "mandelbrot"
  | "primes"
  | "matrix"
  | "fibonacci"
  | "hash";

interface BenchmarkResult {
  wasmTime: number;
  jsTime: number;
  wasmResult: number | number[] | Uint32Array | Float64Array | BigUint64Array;
  jsResult: number | number[];
  speedupRatio: number;
}

const MathBenchmark: React.FC = () => {
  const { wasm, loading, error } = useWasm();
  const [benchmarkType, setBenchmarkType] =
    useState<BenchmarkType>("montecarlo");
  const [iterations, setIterations] = useState<number>(1000000);
  const [matrixSize, setMatrixSize] = useState<number>(100);
  const [primeLimit, setPrimeLimit] = useState<number>(100000);
  const [mandelbrotSize, setMandelbrotSize] = useState<number>(200);
  const [fibonacciN, setFibonciN] = useState<number>(1000);
  const [hashIterations, setHashIterations] = useState<number>(100000);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [running, setRunning] = useState(false);

  // JavaScript implementations for comparison
  const jsMonteCarloPI = (iterations: number): number => {
    let insideCircle = 0;
    for (let i = 0; i < iterations; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      if (x * x + y * y <= 1) {
        insideCircle++;
      }
    }
    return 4 * (insideCircle / iterations);
  };

  const jsMandelbrotIterations = (
    cReal: number,
    cImag: number,
    maxIterations: number
  ): number => {
    let zReal = 0;
    let zImag = 0;
    let iteration = 0;

    while (zReal * zReal + zImag * zImag <= 4 && iteration < maxIterations) {
      const temp = zReal * zReal - zImag * zImag + cReal;
      zImag = 2 * zReal * zImag + cImag;
      zReal = temp;
      iteration++;
    }

    return iteration;
  };

  const jsMandelbrotSet = (
    width: number,
    height: number,
    maxIterations: number
  ): number[] => {
    const result: number[] = [];
    const zoom = 1.0;
    const centerX = 0.0;
    const centerY = 0.0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cReal = (x - width / 2) / (width / 4) / zoom + centerX;
        const cImag = (y - height / 2) / (height / 4) / zoom + centerY;

        const iterations = jsMandelbrotIterations(cReal, cImag, maxIterations);
        result.push(iterations);
      }
    }

    return result;
  };

  const jsPrimeSieve = (limit: number): number[] => {
    if (limit < 2) return [];

    const isPrime = new Array(limit + 1).fill(true);
    isPrime[0] = false;
    isPrime[1] = false;

    const sqrtLimit = Math.sqrt(limit);

    for (let i = 2; i <= sqrtLimit; i++) {
      if (isPrime[i]) {
        for (let j = i * i; j <= limit; j += i) {
          isPrime[j] = false;
        }
      }
    }

    const primes: number[] = [];
    for (let i = 2; i <= limit; i++) {
      if (isPrime[i]) {
        primes.push(i);
      }
    }

    return primes;
  };

  const jsMatrixMultiply = (
    a: number[],
    b: number[],
    rowsA: number,
    colsA: number,
    colsB: number
  ): number[] => {
    const result = new Array(rowsA * colsB).fill(0);

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += a[i * colsA + k] * b[k * colsB + j];
        }
        result[i * colsB + j] = sum;
      }
    }

    return result;
  };

  const jsFibonacci = (n: number): number[] => {
    if (n === 0) return [];

    const fib: number[] = [];
    if (n >= 1) fib.push(0);
    if (n >= 2) fib.push(1);

    for (let i = 2; i < n; i++) {
      fib.push(fib[i - 1] + fib[i - 2]);
    }

    return fib;
  };

  const jsHashComputation = (data: string, iterations: number): number => {
    let hash = 0;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = (hash * 31 + char) >>> 0;
        hash ^= hash >>> 16;
        hash = (hash * 0x85ebca6b) >>> 0;
        hash ^= hash >>> 13;
        hash = (hash * 0xc2b2ae35) >>> 0;
        hash ^= hash >>> 16;
      }
    }

    return hash >>> 0;
  };

  const generateRandomMatrix = (rows: number, cols: number): number[] => {
    const matrix: number[] = [];
    for (let i = 0; i < rows * cols; i++) {
      matrix.push(Math.random() * 10);
    }
    return matrix;
  };

  const runBenchmark = async () => {
    if (!wasm) {
      alert("WASM module not loaded");
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      let wasmTime: number;
      let jsTime: number;
      let wasmResult:
        | number
        | number[]
        | Uint32Array
        | Float64Array
        | BigUint64Array;
      let jsResult: number | number[];

      switch (benchmarkType) {
        case "montecarlo": {
          // WASM Monte Carlo Pi
          const wasmStart1 = performance.now();
          wasmResult = wasm.monte_carlo_pi(iterations);
          wasmTime = performance.now() - wasmStart1;

          // JavaScript Monte Carlo Pi
          const jsStart1 = performance.now();
          jsResult = jsMonteCarloPI(iterations);
          jsTime = performance.now() - jsStart1;
          break;
        }

        case "mandelbrot": {
          // WASM Mandelbrot Set
          const wasmStart2 = performance.now();
          wasmResult = wasm.mandelbrot_set(
            mandelbrotSize,
            mandelbrotSize,
            100,
            1.0,
            0.0,
            0.0
          );
          wasmTime = performance.now() - wasmStart2;

          // JavaScript Mandelbrot Set
          const jsStart2 = performance.now();
          jsResult = jsMandelbrotSet(mandelbrotSize, mandelbrotSize, 100);
          jsTime = performance.now() - jsStart2;
          break;
        }

        case "primes": {
          // WASM Prime Sieve
          const wasmStart3 = performance.now();
          wasmResult = wasm.prime_sieve(primeLimit);
          wasmTime = performance.now() - wasmStart3;

          // JavaScript Prime Sieve
          const jsStart3 = performance.now();
          jsResult = jsPrimeSieve(primeLimit);
          jsTime = performance.now() - jsStart3;
          break;
        }

        case "matrix": {
          const matrixA = generateRandomMatrix(matrixSize, matrixSize);
          const matrixB = generateRandomMatrix(matrixSize, matrixSize);

          // WASM Matrix Multiplication
          const wasmStart4 = performance.now();
          wasmResult = wasm.matrix_multiply(
            new Float64Array(matrixA),
            new Float64Array(matrixB),
            matrixSize,
            matrixSize,
            matrixSize
          );
          wasmTime = performance.now() - wasmStart4;

          // JavaScript Matrix Multiplication
          const jsStart4 = performance.now();
          jsResult = jsMatrixMultiply(
            matrixA,
            matrixB,
            matrixSize,
            matrixSize,
            matrixSize
          );
          jsTime = performance.now() - jsStart4;
          break;
        }

        case "fibonacci": {
          // WASM Fibonacci
          const wasmStart5 = performance.now();
          wasmResult = wasm.fibonacci_sequence(fibonacciN);
          wasmTime = performance.now() - wasmStart5;

          // JavaScript Fibonacci
          const jsStart5 = performance.now();
          jsResult = jsFibonacci(fibonacciN);
          jsTime = performance.now() - jsStart5;
          break;
        }

        case "hash": {
          const testData =
            "Hello, World! This is a test string for hash computation.";

          // WASM Hash
          const wasmStart6 = performance.now();
          wasmResult = wasm.hash_computation(testData, hashIterations);
          wasmTime = performance.now() - wasmStart6;

          // JavaScript Hash
          const jsStart6 = performance.now();
          jsResult = jsHashComputation(testData, hashIterations);
          jsTime = performance.now() - jsStart6;
          break;
        }

        default:
          throw new Error("Unknown benchmark type");
      }

      const speedupRatio = jsTime / wasmTime;

      setResult({
        wasmTime,
        jsTime,
        wasmResult,
        jsResult,
        speedupRatio,
      });
    } catch (err) {
      console.error("Benchmark error:", err);
      alert("Error running benchmark: " + err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading WebAssembly module...</h2>
        <p>Initializing mathematical computation engine</p>
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
    <div className="math-benchmark">
      <div className="controls">
        <h2>🧮 Mathematical Performance Benchmark</h2>
        <p>Compare WASM vs JavaScript performance on compute-intensive tasks</p>

        <div className="benchmark-selector">
          <h3>Choose Benchmark:</h3>
          <div className="benchmark-options">
            <label>
              <input
                type="radio"
                value="montecarlo"
                checked={benchmarkType === "montecarlo"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              🎯 Monte Carlo Pi Estimation
            </label>
            <label>
              <input
                type="radio"
                value="mandelbrot"
                checked={benchmarkType === "mandelbrot"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              🌀 Mandelbrot Set Generation
            </label>
            <label>
              <input
                type="radio"
                value="primes"
                checked={benchmarkType === "primes"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              🔢 Prime Number Sieve
            </label>
            <label>
              <input
                type="radio"
                value="matrix"
                checked={benchmarkType === "matrix"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              📊 Matrix Multiplication
            </label>
            <label>
              <input
                type="radio"
                value="fibonacci"
                checked={benchmarkType === "fibonacci"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              🌀 Fibonacci Sequence
            </label>
            <label>
              <input
                type="radio"
                value="hash"
                checked={benchmarkType === "hash"}
                onChange={(e) =>
                  setBenchmarkType(e.target.value as BenchmarkType)
                }
              />
              🔐 Hash Computation
            </label>
          </div>
        </div>

        <div className="parameters">
          <h3>Parameters:</h3>
          {benchmarkType === "montecarlo" && (
            <label>
              Iterations:
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
              >
                <option value={100000}>100,000</option>
                <option value={500000}>500,000</option>
                <option value={1000000}>1,000,000</option>
                <option value={5000000}>5,000,000</option>
                <option value={10000000}>10,000,000</option>
              </select>
            </label>
          )}
          {benchmarkType === "mandelbrot" && (
            <label>
              Image Size:
              <select
                value={mandelbrotSize}
                onChange={(e) => setMandelbrotSize(Number(e.target.value))}
              >
                <option value={100}>100x100</option>
                <option value={200}>200x200</option>
                <option value={400}>400x400</option>
                <option value={800}>800x800</option>
              </select>
            </label>
          )}
          {benchmarkType === "primes" && (
            <label>
              Upper Limit:
              <select
                value={primeLimit}
                onChange={(e) => setPrimeLimit(Number(e.target.value))}
              >
                <option value={10000}>10,000</option>
                <option value={50000}>50,000</option>
                <option value={100000}>100,000</option>
                <option value={500000}>500,000</option>
                <option value={1000000}>1,000,000</option>
              </select>
            </label>
          )}
          {benchmarkType === "matrix" && (
            <label>
              Matrix Size:
              <select
                value={matrixSize}
                onChange={(e) => setMatrixSize(Number(e.target.value))}
              >
                <option value={50}>50x50</option>
                <option value={100}>100x100</option>
                <option value={200}>200x200</option>
                <option value={300}>300x300</option>
                <option value={500}>500x500</option>
              </select>
            </label>
          )}
          {benchmarkType === "fibonacci" && (
            <label>
              Sequence Length:
              <select
                value={fibonacciN}
                onChange={(e) => setFibonciN(Number(e.target.value))}
              >
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
                <option value={50000}>50,000</option>
              </select>
            </label>
          )}
          {benchmarkType === "hash" && (
            <label>
              Hash Iterations:
              <select
                value={hashIterations}
                onChange={(e) => setHashIterations(Number(e.target.value))}
              >
                <option value={10000}>10,000</option>
                <option value={50000}>50,000</option>
                <option value={100000}>100,000</option>
                <option value={500000}>500,000</option>
                <option value={1000000}>1,000,000</option>
              </select>
            </label>
          )}
        </div>

        <button
          className="benchmark-button"
          onClick={runBenchmark}
          disabled={running}
        >
          {running ? "Running Benchmark..." : "🚀 Run Benchmark"}
        </button>
      </div>

      {result && (
        <div className="results">
          <h3>📊 Benchmark Results</h3>
          <div className="performance-comparison">
            <div className="performance-metric">
              <h4>🦀 Rust WebAssembly</h4>
              <div className="time">{result.wasmTime.toFixed(2)} ms</div>
            </div>
            <div className="vs">VS</div>
            <div className="performance-metric">
              <h4>⚡ JavaScript</h4>
              <div className="time">{result.jsTime.toFixed(2)} ms</div>
            </div>
          </div>

          <div className="speedup">
            {result.speedupRatio > 1 ? (
              <div className="winner wasm-winner">
                🏆 WASM is {result.speedupRatio.toFixed(2)}x FASTER!
              </div>
            ) : (
              <div className="winner js-winner">
                JavaScript is {(1 / result.speedupRatio).toFixed(2)}x faster
              </div>
            )}
          </div>

          <div className="result-details">
            <h4>Computation Results:</h4>
            <div className="result-comparison">
              <div>
                <strong>WASM Result:</strong>
                <pre>
                  {typeof result.wasmResult === "object"
                    ? `Array length: ${result.wasmResult.length}`
                    : result.wasmResult.toString()}
                </pre>
              </div>
              <div>
                <strong>JavaScript Result:</strong>
                <pre>
                  {typeof result.jsResult === "object"
                    ? `Array length: ${result.jsResult.length}`
                    : result.jsResult.toString()}
                </pre>
              </div>
            </div>
          </div>

          <div className="analysis">
            <h4>🔍 Why WASM Excels Here:</h4>
            <ul>
              <li>
                🧮 <strong>Pure computation:</strong> No JS-WASM boundary
                crossings during loops
              </li>
              <li>
                ⚡ <strong>Optimized machine code:</strong> Direct compilation
                to efficient instructions
              </li>
              <li>
                🎯 <strong>Predictable performance:</strong> No JIT compilation
                overhead
              </li>
              <li>
                🔢 <strong>Numerical operations:</strong> WASM excels at
                mathematical computations
              </li>
              <li>
                📦 <strong>Memory efficiency:</strong> Better control over
                memory layout and usage
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathBenchmark;
