# WASM vs JavaScript Performance Comparison

A comprehensive web application that demonstrates and compares the performance characteristics of WebAssembly (WASM) versus JavaScript across different types of computational tasks.

## 🚀 Features

### 🧮 Mathematical Benchmarks
Where WASM truly excels - compute-intensive algorithms:
- **Monte Carlo Pi Estimation** - Random sampling to approximate π
- **Mandelbrot Set Generation** - Complex mathematical fractal computation
- **Prime Number Sieve** - Efficient prime number generation
- **Matrix Multiplication** - Linear algebra operations
- **Fibonacci Sequence** - Recursive mathematical sequences
- **Hash Computation** - Cryptographic-style hashing

### 📸 Photo Sorting Benchmark
Real-world data sorting comparison:
- Fetch photos from JSONPlaceholder API
- Sort by various criteria (ID, Album, Title, etc.)
- Support for large datasets (up to 50,000+ items)
- Custom predicate functions
- Performance analysis with detailed explanations

### 📊 Custom Array Sorting
Educational tool for understanding sorting performance:
- Numbers, strings, and custom object sorting
- User-defined comparison functions
- Interactive performance metrics

## 🎯 Key Insights

### When WASM Wins
- **Heavy Mathematical Computations**: Matrix operations, fractal generation
- **CPU-Intensive Algorithms**: Prime generation, hash computation
- **Minimal JS-WASM Boundary Crossings**: Pure computational tasks
- **Predictable Performance**: No JIT compilation overhead

### When JavaScript Wins
- **Array Sorting**: Highly optimized native implementations
- **Small Datasets**: WASM initialization overhead
- **Complex Object Manipulation**: Native JS object handling
- **Frequent Boundary Crossings**: Callback-heavy operations

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **WebAssembly**: Rust + wasm-pack + wasm-bindgen
- **Styling**: Custom CSS with responsive design
- **Performance**: High-resolution timing API for accurate measurements

## 🏗️ Project Structure

```
├── src/
│   ├── components/
│   │   ├── MathBenchmark.tsx    # Mathematical performance tests
│   │   ├── PhotoSorter.tsx      # Real-world sorting comparison
│   │   └── ArraySorter.tsx      # Custom array sorting
│   ├── hooks/
│   │   └── useWasm.ts           # WebAssembly module loader
│   └── App.tsx                  # Main application
├── wasm-sorter/                 # Rust WebAssembly module
│   ├── src/lib.rs              # WASM implementations
│   └── Cargo.toml              # Rust dependencies
└── pkg/                        # Generated WASM bindings (git-ignored)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- Rust toolchain
- wasm-pack

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kmsbismarckx/wasm-vs-js.git
cd wasm-vs-js
```

2. Install dependencies:
```bash
npm install
```

3. Build the WebAssembly module:
```bash
cd wasm-sorter
wasm-pack build --target web --out-dir ../pkg
cd ..
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## 📈 Performance Analysis

The application provides detailed performance analysis including:

- **Execution Time Comparison**: Precise millisecond measurements
- **Speed-up Ratios**: How much faster one implementation is
- **Educational Explanations**: Why certain approaches perform better
- **Real-world Factors**: Boundary crossing costs, memory layout, JIT optimization

## 🔍 Example Results

### Monte Carlo Pi (1M iterations)
- **WASM**: ~45ms - Consistent, optimized machine code
- **JavaScript**: ~120ms - JIT compilation overhead

### Photo Sorting (50K items)
- **WASM**: ~85ms - Object serialization overhead
- **JavaScript**: ~35ms - Native array optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Learning Resources

This project serves as an educational tool for understanding:
- WebAssembly performance characteristics
- JavaScript engine optimizations
- When to use WASM vs JavaScript
- Performance measurement techniques
- Rust-to-WASM compilation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Live Demo

[View Live Demo](https://your-deployment-url.com) *(Deploy to Vercel/Netlify and update this link)*

---

**Built with ❤️ to demonstrate the power and proper use cases of WebAssembly**