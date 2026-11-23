# gpu-abstract

WebGPU Compute Shader abstraction library.

Write JavaScript functions, automatically get WGSL shaders, automatic bind group management, memory lifecycle tracking, and Chrome DevTools integration.

## Why?

WebGPU is powerful but the API is low-level. This library lets you write GPU compute like you write JavaScript functions, handling the heavy lifting so you can focus on your algorithm.

## Features

- **js-to-wgsl**: Auto-transpile JavaScript functions to WGSL shader code
- **binding-manager**: Automatic bind group layout generation and binding updates
- **memory-lifecycle**: GPU buffer lifecycle management with leak detection
- **devtools-panel**: Chrome DevTools panel for real-time GPU state visualization
- **cross-browser**: Works across Chrome, Safari, Firefox, Edge

## Quick Start

```js
import { compute, useContext } from 'gpu-abstract';

// Create a compute context
const ctx = await useContext();

// Define a computation as a JS function
const double = compute((data) => {
  return data.map(x => x * 2);
});

// Run on GPU
const input = new Float32Array([1, 2, 3, 4]);
const output = await double(ctx, input);

console.log(output); // [2, 4, 6, 8]
```

## Documentation

- [API Reference](./docs/api.md)
- [DevTools Integration](./docs/devtools.md)
- [Migration Guide](./docs/migration.md)

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Start docs dev server
pnpm docs
```

## Roadmap

- v0.1.0: Core compute + binding management + DevTools panel
- v0.2.0: Multi-shader chaining + advanced memory management
- v1.0.0: Production-ready with full type safety and CI/CD

## License

MIT

<p align="center">
  <a href="https://github.com/zkzWilliamzhou/gpu-abstract">
    <img src="https://img.shields.io/github/stars/zkzWilliamzhou/gpu-abstract?style=flat-square" alt="GitHub stars">
  </a>
</p>