use js_sys::{Array, Function};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

// Macro for easier console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn sort_array(array: &Array, predicate: &Function) -> Result<Array, JsValue> {
    console_log!("Starting sort with array length: {}", array.length());

    let mut items: Vec<(JsValue, usize)> = Vec::new();

    // Convert JS array to Rust vector with original indices
    for i in 0..array.length() {
        let item = array.get(i);
        items.push((item, i as usize));
    }

    // Sort using the predicate function
    items.sort_by(|a, b| {
        let result = predicate.call2(&JsValue::null(), &a.0, &b.0);
        match result {
            Ok(val) => {
                if let Some(num) = val.as_f64() {
                    if num < 0.0 {
                        std::cmp::Ordering::Less
                    } else if num > 0.0 {
                        std::cmp::Ordering::Greater
                    } else {
                        std::cmp::Ordering::Equal
                    }
                } else {
                    std::cmp::Ordering::Equal
                }
            }
            Err(_) => std::cmp::Ordering::Equal,
        }
    });

    // Convert back to JS array
    let result_array = Array::new();
    for (item, _) in items {
        result_array.push(&item);
    }

    console_log!(
        "Sort completed with result length: {}",
        result_array.length()
    );
    Ok(result_array)
}

#[wasm_bindgen]
pub fn sort_numbers(numbers: &Array, ascending: bool) -> Array {
    console_log!("Sorting numbers, ascending: {}", ascending);

    let mut nums: Vec<f64> = Vec::new();

    // Convert JS array to Rust vector
    for i in 0..numbers.length() {
        if let Some(num) = numbers.get(i).as_f64() {
            nums.push(num);
        }
    }

    // Sort
    if ascending {
        nums.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    } else {
        nums.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
    }

    // Convert back to JS array
    let result = Array::new();
    for num in nums {
        result.push(&JsValue::from_f64(num));
    }

    result
}

#[wasm_bindgen]
pub fn sort_strings(strings: &Array, ascending: bool) -> Array {
    console_log!("Sorting strings, ascending: {}", ascending);

    let mut strs: Vec<String> = Vec::new();

    // Convert JS array to Rust vector
    for i in 0..strings.length() {
        if let Some(s) = strings.get(i).as_string() {
            strs.push(s);
        }
    }

    // Sort
    if ascending {
        strs.sort();
    } else {
        strs.sort_by(|a, b| b.cmp(a));
    }

    // Convert back to JS array
    let result = Array::new();
    for s in strs {
        result.push(&JsValue::from_str(&s));
    }

    result
}

// Compute-intensive algorithms where WASM excels

#[wasm_bindgen]
pub fn test_simple_math(a: f64, b: f64) -> f64 {
    console_log!("Simple test: {} + {} = {}", a, b, a + b);
    a + b
}

#[wasm_bindgen]
pub fn monte_carlo_pi(iterations: u32) -> f64 {
    console_log!(
        "Computing Pi using Monte Carlo with {} iterations",
        iterations
    );

    if iterations == 0 {
        console_log!("Warning: iterations is 0");
        return 0.0;
    }

    let mut inside_circle = 0u32;
    let mut rng_state = 12345u64;

    // Debug: log first few values
    let mut debug_count = 0;

    for i in 0..iterations {
        // Better LCG implementation
        rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
        let x = (rng_state % 2147483647) as f64 / 2147483647.0 * 2.0 - 1.0;

        rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
        let y = (rng_state % 2147483647) as f64 / 2147483647.0 * 2.0 - 1.0;

        if debug_count < 5 {
            console_log!(
                "Debug {}: x={}, y={}, distance={}",
                debug_count,
                x,
                y,
                (x * x + y * y).sqrt()
            );
            debug_count += 1;
        }

        if x * x + y * y <= 1.0 {
            inside_circle += 1;
        }

        // Early progress report for large iterations
        if i > 0 && i % 1000000 == 0 {
            let partial_pi = 4.0 * (inside_circle as f64) / ((i + 1) as f64);
            console_log!(
                "Progress at {} iterations: partial Pi = {}",
                i + 1,
                partial_pi
            );
        }
    }

    let result = 4.0 * (inside_circle as f64) / (iterations as f64);
    console_log!(
        "Monte Carlo completed: inside_circle = {}, total = {}, result = {}",
        inside_circle,
        iterations,
        result
    );
    result
}

#[wasm_bindgen]
pub fn mandelbrot_iterations(c_real: f64, c_imag: f64, max_iterations: u32) -> u32 {
    let mut z_real = 0.0;
    let mut z_imag = 0.0;
    let mut iteration = 0;

    while z_real * z_real + z_imag * z_imag <= 4.0 && iteration < max_iterations {
        let temp = z_real * z_real - z_imag * z_imag + c_real;
        z_imag = 2.0 * z_real * z_imag + c_imag;
        z_real = temp;
        iteration += 1;
    }

    iteration
}

#[wasm_bindgen]
pub fn mandelbrot_set(
    width: u32,
    height: u32,
    max_iterations: u32,
    zoom: f64,
    center_x: f64,
    center_y: f64,
) -> Vec<u32> {
    console_log!(
        "Computing Mandelbrot set {}x{} with {} iterations",
        width,
        height,
        max_iterations
    );

    let mut result = Vec::with_capacity((width * height) as usize);

    for y in 0..height {
        for x in 0..width {
            let c_real = (x as f64 - width as f64 / 2.0) / (width as f64 / 4.0) / zoom + center_x;
            let c_imag = (y as f64 - height as f64 / 2.0) / (height as f64 / 4.0) / zoom + center_y;

            let iterations = mandelbrot_iterations(c_real, c_imag, max_iterations);
            result.push(iterations);
        }
    }

    result
}

#[wasm_bindgen]
pub fn prime_sieve(limit: u32) -> Vec<u32> {
    console_log!("Computing prime numbers up to {}", limit);

    if limit < 2 {
        return Vec::new();
    }

    let mut is_prime = vec![true; (limit + 1) as usize];
    is_prime[0] = false;
    is_prime[1] = false;

    let sqrt_limit = (limit as f64).sqrt() as u32;

    for i in 2..=sqrt_limit {
        if is_prime[i as usize] {
            let mut j = i * i;
            while j <= limit {
                is_prime[j as usize] = false;
                j += i;
            }
        }
    }

    let mut primes = Vec::new();
    for i in 2..=limit {
        if is_prime[i as usize] {
            primes.push(i);
        }
    }

    primes
}

#[wasm_bindgen]
pub fn matrix_multiply(
    a: &[f64],
    b: &[f64],
    rows_a: usize,
    cols_a: usize,
    cols_b: usize,
) -> Vec<f64> {
    console_log!(
        "Matrix multiplication: {}x{} * {}x{}",
        rows_a,
        cols_a,
        cols_a,
        cols_b
    );

    let mut result = vec![0.0; rows_a * cols_b];

    for i in 0..rows_a {
        for j in 0..cols_b {
            let mut sum = 0.0;
            for k in 0..cols_a {
                sum += a[i * cols_a + k] * b[k * cols_b + j];
            }
            result[i * cols_b + j] = sum;
        }
    }

    result
}

#[wasm_bindgen]
pub fn fibonacci_sequence(n: u32) -> Vec<u64> {
    console_log!("Computing Fibonacci sequence up to {}", n);

    if n == 0 {
        return Vec::new();
    }

    let mut fib = Vec::with_capacity(n as usize);

    if n >= 1 {
        fib.push(0u64);
    }
    if n >= 2 {
        fib.push(1u64);
    }

    for i in 2..n {
        let prev2 = fib[(i - 2) as usize];
        let prev1 = fib[(i - 1) as usize];
        let next = prev1.wrapping_add(prev2);
        fib.push(next);
    }

    fib
}

#[wasm_bindgen]
pub fn hash_computation(data: &str, iterations: u32) -> u32 {
    console_log!("Computing hash with {} iterations", iterations);

    let mut hash = 0u32;
    let bytes = data.as_bytes();

    for _ in 0..iterations {
        for &byte in bytes {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u32);
            hash ^= hash >> 16;
            hash = hash.wrapping_mul(0x85ebca6b);
            hash ^= hash >> 13;
            hash = hash.wrapping_mul(0xc2b2ae35);
            hash ^= hash >> 16;
        }
    }

    hash
}
