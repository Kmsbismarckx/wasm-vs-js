import { useState, useEffect } from "react";

type SortPredicate<T> = (a: T, b: T) => number;

interface WasmModule {
  init_panic_hook: () => void;
  sort_array: <T>(array: T[], predicate: SortPredicate<T>) => T[];
  sort_numbers: (numbers: number[], ascending: boolean) => number[];
  sort_strings: (strings: string[], ascending: boolean) => string[];
  // Mathematical computation functions
  test_simple_math: (a: number, b: number) => number;
  monte_carlo_pi: (iterations: number) => number;
  mandelbrot_set: (
    width: number,
    height: number,
    max_iterations: number,
    zoom: number,
    center_x: number,
    center_y: number
  ) => Uint32Array;
  prime_sieve: (limit: number) => Uint32Array;
  matrix_multiply: (
    a: Float64Array,
    b: Float64Array,
    rows_a: number,
    cols_a: number,
    cols_b: number
  ) => Float64Array;
  fibonacci_sequence: (n: number) => BigUint64Array;
  hash_computation: (data: string, iterations: number) => number;
}

export const useWasm = () => {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmModule = await import("../../pkg/wasm_sorter.js");
        await wasmModule.default();

        wasmModule.init_panic_hook();

        setWasm({
          init_panic_hook: wasmModule.init_panic_hook,
          sort_array: wasmModule.sort_array,
          sort_numbers: wasmModule.sort_numbers,
          sort_strings: wasmModule.sort_strings,
          test_simple_math: wasmModule.test_simple_math,
          monte_carlo_pi: wasmModule.monte_carlo_pi,
          mandelbrot_set: wasmModule.mandelbrot_set,
          prime_sieve: wasmModule.prime_sieve,
          matrix_multiply: wasmModule.matrix_multiply,
          fibonacci_sequence: wasmModule.fibonacci_sequence,
          hash_computation: wasmModule.hash_computation,
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to load WASM module:", err);
        setError("Failed to load WebAssembly module");
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  return { wasm, loading, error };
};
