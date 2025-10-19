import React, { useState } from "react";
import { useWasm } from "../hooks/useWasm";
import "./ArraySorter.css";

type SortType = "numbers" | "strings" | "custom";

const ArraySorter: React.FC = () => {
  const { wasm, loading, error } = useWasm();
  const [sortType, setSortType] = useState<SortType>("numbers");
  const [inputArray, setInputArray] = useState<string>("");
  const [customPredicate, setCustomPredicate] =
    useState<string>("(a, b) => a - b");
  const [sortedArray, setSortedArray] = useState<unknown[]>([]);
  const [ascending, setAscending] = useState(true);
  const [sortTime, setSortTime] = useState<number | null>(null);

  const parseArray = (input: string): unknown[] => {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error("Not an array");
    } catch {
      // Fall back to comma-separated values
      return input
        .split(",")
        .map((item) => {
          const trimmed = item.trim();

          // Try to parse as number
          const num = Number(trimmed);
          if (!isNaN(num)) {
            return num;
          }

          // Return as string
          return trimmed;
        })
        .filter((item) => item !== "");
    }
  };

  const handleSort = () => {
    if (!wasm || !inputArray.trim()) return;

    try {
      const parsedArray = parseArray(inputArray);
      const startTime = performance.now();

      let result: unknown[];

      if (sortType === "numbers") {
        const numberArray = parsedArray
          .map((item) => Number(item))
          .filter((num) => !isNaN(num));
        result = wasm.sort_numbers(numberArray, ascending);
      } else if (sortType === "strings") {
        const stringArray = parsedArray.map((item) => String(item));
        result = wasm.sort_strings(stringArray, ascending);
      } else {
        // Custom predicate
        const predicate = new Function(
          "a",
          "b",
          `return ${customPredicate}`
        ) as (a: unknown, b: unknown) => number;
        result = wasm.sort_array(parsedArray, predicate);
      }

      const endTime = performance.now();
      setSortTime(endTime - startTime);
      setSortedArray(result);
    } catch (err) {
      console.error("Sorting error:", err);
      alert("Error during sorting. Please check your input and predicate.");
    }
  };

  const exampleArrays = {
    numbers: "[64, 34, 25, 12, 22, 11, 90]",
    strings: '["banana", "apple", "orange", "grape", "kiwi"]',
    custom:
      '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Charlie", "age": 35}]',
  };

  const examplePredicates = {
    ascending: "(a, b) => a - b",
    descending: "(a, b) => b - a",
    byLength: "(a, b) => a.length - b.length",
    byAge: "(a, b) => a.age - b.age",
    byName: "(a, b) => a.name.localeCompare(b.name)",
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
    <div className="array-sorter">
      <div className="controls">
        <div className="sort-type-selector">
          <h3>Sort Type</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="numbers"
                checked={sortType === "numbers"}
                onChange={(e) => setSortType(e.target.value as SortType)}
              />
              Numbers
            </label>
            <label>
              <input
                type="radio"
                value="strings"
                checked={sortType === "strings"}
                onChange={(e) => setSortType(e.target.value as SortType)}
              />
              Strings
            </label>
            <label>
              <input
                type="radio"
                value="custom"
                checked={sortType === "custom"}
                onChange={(e) => setSortType(e.target.value as SortType)}
              />
              Custom Predicate
            </label>
          </div>
        </div>

        <div className="array-input">
          <h3>Input Array</h3>
          <textarea
            value={inputArray}
            onChange={(e) => setInputArray(e.target.value)}
            placeholder="Enter array as JSON or comma-separated values"
            rows={4}
          />
          <div className="examples">
            <h4>Examples:</h4>
            <button onClick={() => setInputArray(exampleArrays.numbers)}>
              Numbers: {exampleArrays.numbers}
            </button>
            <button onClick={() => setInputArray(exampleArrays.strings)}>
              Strings: {exampleArrays.strings}
            </button>
            <button onClick={() => setInputArray(exampleArrays.custom)}>
              Objects: {exampleArrays.custom}
            </button>
          </div>
        </div>

        {sortType !== "custom" && (
          <div className="direction-selector">
            <h3>Sort Direction</h3>
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

        {sortType === "custom" && (
          <div className="predicate-input">
            <h3>Custom Predicate Function</h3>
            <input
              type="text"
              value={customPredicate}
              onChange={(e) => setCustomPredicate(e.target.value)}
              placeholder="(a, b) => comparison"
            />
            <div className="examples">
              <h4>Predicate Examples:</h4>
              <button
                onClick={() => setCustomPredicate(examplePredicates.ascending)}
              >
                Ascending: {examplePredicates.ascending}
              </button>
              <button
                onClick={() => setCustomPredicate(examplePredicates.descending)}
              >
                Descending: {examplePredicates.descending}
              </button>
              <button
                onClick={() => setCustomPredicate(examplePredicates.byLength)}
              >
                By Length: {examplePredicates.byLength}
              </button>
              <button
                onClick={() => setCustomPredicate(examplePredicates.byAge)}
              >
                By Age: {examplePredicates.byAge}
              </button>
              <button
                onClick={() => setCustomPredicate(examplePredicates.byName)}
              >
                By Name: {examplePredicates.byName}
              </button>
            </div>
          </div>
        )}

        <button
          className="sort-button"
          onClick={handleSort}
          disabled={!inputArray.trim()}
        >
          Sort with Rust WebAssembly
        </button>
      </div>

      <div className="results">
        <h3>Results</h3>
        {sortTime !== null && (
          <p className="sort-time">
            Sorted in {sortTime.toFixed(2)}ms using Rust WebAssembly
          </p>
        )}
        {sortedArray.length > 0 && (
          <div className="sorted-array">
            <h4>Sorted Array:</h4>
            <pre>{JSON.stringify(sortedArray, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArraySorter;
