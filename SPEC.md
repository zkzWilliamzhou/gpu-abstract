# gpu-abstract - SPEC v0.1.0

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | gpu-abstract |
| **GitHub** | zkzWilliamzhou/gpu-abstract |
| **Description** | WebGPU Compute Shader abstraction library - write JS functions, get WGSL shaders + automatic bind group management + memory lifecycle + DevTools panel |
| **Target Stars** | 8K-15K |
| **License** | MIT |
| **Language** | TypeScript (strict) |

---

## Core Value Proposition

**"Write GPU compute like JavaScript functions. gpu-abstract handles WGSL, bindings, memory, and debugging."**

- **Problem**: WebGPU Compute Shaders are powerful but require 100+ lines of boilerplate: device creation, shader module, bind group layouts, bind groups, buffers, command encoders, dispatch. Debugging is primitive (console.log in shader = not possible). No cross-browser abstraction for workgroup size limits, buffer alignment, timestamp queries.
- **Solution**: A library where you write a JS function with type annotations, and it: (1) transpiles to WGSL, (2) creates optimal bind group layouts, (3) manages buffer lifecycle with pooling, (4) provides Chrome DevTools panel for inspection, (5) handles cross-browser quirks automatically.
- **Unique Angle**: JS→WGSL transpilation + automatic bind group management + buffer pooling + DevTools panel + zero config cross-browser = **the "TypeScript for WebGPU Compute"**.

---

## User Personas

| Persona | Pain Point | Success Metric |
|---------|------------|----------------|
| **ML/WebGL Dev** | Wants GPU compute without learning WGSL boilerplate | Ports CPU algorithm to GPU in <30 min |
| **Data Visualization** | Large dataset processing (1M+ points) blocking main thread | 10x speedup, <16ms frame budget |
| **Game Dev** | Physics, particles, compute shaders for game logic | Integrates in existing WebGPU render pipeline |
| **Scientific Computing** | Matrix ops, FFT, simulations in browser | Matches native performance, readable code |

---

## Feature Specification

### Phase 1 (v0.1.0) - MVP

#### 1. JS→WGSL Transpiler (`js-to-wgsl`)
- **Input**: TypeScript function with JSDoc type annotations
```typescript
// User writes:
/** @param {f32[]} a */
/** @param {f32[]} b */
/** @returns {f32[]} */
function matmul(a, b) { /* ... */ }
```
- **Output**: Valid WGSL compute shader with `@compute @workgroup_size(64)`
- **Supported Types**: `f32`, `f16`, `i32`, `u32`, `vec2<f32>`, `vec3<f32>`, `vec4<f32>`, `mat4x4<f32>`, arrays `f32[]`, `vec3<f32>[]`
- **Control Flow**: `if/else`, `for` (constant bounds), `while` (with max iterations hint)
- **Math**: `+ - * / %`, `Math.*` → WGSL builtins, swizzle (`.xyz`, `.rg`)
- **Builtins**: `dot`, `cross`, `normalize`, `length`, `min`, `max`, `clamp`, `mix`, `step`, `smoothstep`
- **Limitations (v0.1)**: No recursion, no dynamic indexing in uniform buffers, no function calls (inline all)

#### 2. Binding Manager (`binding-manager`)
- **Automatic Bind Group Layout**: Analyzes function params → generates `@group(0) @binding(N)` layout
- **Buffer Types**: 
  - `readOnly` → `@group(0) @binding(N) var<storage, read> buffer: array<f32>`
  - `writeOnly` → `@group(0) @binding(N) var<storage, write> buffer: array<f32>`
  - `readWrite` → `@group(0) @binding(N) var<storage, read_write> buffer: array<f32>`
  - `uniform` → `@group(0) @binding(N) var<uniform> params: ParamsStruct`
- **Binding Updates**: `bindingManager.update('paramName', newData)` → queues buffer write
- **Bind Group Caching**: Reuses bind groups when layout unchanged

#### 3. Memory Lifecycle (`memory-lifecycle`)
- **Buffer Pool**: `BufferPool.get(size, usage)` → returns `GPUBuffer` from pool or creates new
- **Automatic Return**: Buffers returned to pool after `GPUQueue.submit()` + fence
- **Leak Detection**: Dev mode tracks all allocations, warns on unreturned buffers
- **Memory Pressure**: `navigator.deviceMemory` heuristic → auto-evicts LRU buffers
- **Staging Buffers**: Auto-manages `MAP_READ`/`MAP_WRITE` staging for readback

#### 4. Compute Dispatch (`compute-dispatch`)
```typescript
// High-level API
const kernel = gpu.createKernel(matmul);
const result = await kernel(inputA, inputB, { 
  workgroupSize: [64],  // auto-calculated if omitted
  outputBuffer: preallocated // optional
});

// Low-level control
const dispatch = kernel.dispatch({
  workgroups: [Math.ceil(N / 64)],
  bindings: { a: bufferA, b: bufferB, result: bufferOut }
});
await dispatch.execute();
const data = await dispatch.readback();
```

#### 5. DevTools Panel (`devtools-panel`)
- **Chrome DevTools Extension** (Manifest V3)
- **Panel Tabs**:
  - **Kernels**: List of registered kernels, source JS, generated WGSL, bind group layout
  - **Dispatches**: Timeline of dispatches, duration, workgroups, buffer sizes
  - **Buffers**: Live view of all buffers: size, usage, contents (readback on click)
  - **Performance**: GPU timestamp queries (if supported), GPU/CPU time correlation
  - **Errors**: Shader compilation errors, validation errors, out-of-bounds access
- **Integration**: `gpu.devtools.connect()` injects panel, no code changes needed

#### 6. Cross-Browser Compatibility Layer
| Feature | Chrome | Safari | Firefox | Edge | gpu-abstract Handling |
|---------|--------|--------|---------|------|----------------------|
| `timestamp-query` | ✅ | ❌ | ⚠️ | ✅ | Polyfill with CPU timestamps |
| `subgroups` | ✅ | ❌ | ✅ | ✅ | Feature detection, fallback |
| `f16` storage | ✅ | ✅ | ⚠️ | ✅ | Auto-promote to f32 if unsupported |
| `workgroup_size` max | 256 | 256 | 256 | 256 | Auto-clamp |
| Buffer alignment | 256B | 256B | 256B | 256B | Auto-align |

#### 7. TypeScript Integration
```typescript
// Full type inference from JSDoc
const matmul = gpu.createKernel(
  /** @param {f32[]} a */
  /** @param {f32[]} b */
  /** @returns {f32[]} */
  function(a, b) { /* ... */ }
);

// matmul has inferred type: (a: Float32Array, b: Float32Array) => Promise<Float32Array>
```

---

### Phase 2 (v0.2.0) - Enhanced

- **Shader Composition**: Chain multiple kernels, auto-insert barrier dispatches
- **Graphics Interop**: Share buffers with render pipelines (vertex/index/storage)
- **WGSL Modules**: Import shared WGSL functions (`@import "common.wgsl"`)
- **Debug Shader**: Source maps from WGSL → original JS lines
- **Profiling API**: `gpu.profile(kernel, inputs)` → detailed flamegraph

---

### Phase 3 (v1.0.0) - Production

- **WebGPU Canvas Integration**: Direct texture output for visualization
- **WASM Fallback**: For browsers without WebGPU (via `webgpu-headers` + WASM)
- **Persistent Kernels**: IndexedDB cache of compiled pipelines
- **Multi-GPU**: `navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })` selection

---

## Technical Architecture

### Stack
- **Language**: TypeScript 5.x (strict)
- **Transpiler**: Custom AST transform (TypeScript Compiler API → WGSL AST → WGSL string)
- **WebGPU**: Native `navigator.gpu` (no wrapper)
- **DevTools**: Chrome Extension MV3 + `chrome.devtools.panels`
- **Testing**: Vitest (unit), Playwright + Chrome (E2E with real WebGPU)
- **Build**: tsup (ESM+CJS, d.ts)
- **Docs**: VitePress

### Project Structure
```
gpu-abstract/
├── packages/
│   ├── transpiler/           # JS→WGSL: parser, type-checker, codegen
│   ├── binding/              # Bind group layout, binding manager, buffer pool
│   ├── dispatch/             # Kernel, dispatch, readback, profiling
│   ├── devtools/             # Chrome DevTools panel (separate extension build)
│   ├── compat/               # Cross-browser feature detection, polyfills
│   └── core/                 # Main exports, context, types
├── apps/
│   ├── playground/           # Web demo (Vite + Three.js viz)
│   └── devtools-extension/   # Chrome extension build
├── tests/
│   ├── unit/                 # Transpiler, binding, dispatch tests
│   ├── e2e/                  # Real WebGPU E2E (requires GPU CI runner)
│   └── golden/               # WGSL output snapshots
├── docs/                     # VitePress
├── package.json
└── README.md
```

---

## API Contracts

### Core Exports
```typescript
// packages/core/src/index.ts
export { GPUContext } from './context';
export { createKernel, Kernel } from './kernel';
export { BindingManager } from './binding';
export { BufferPool } from './memory';
export { DevTools } from './devtools';

// Types
export type { 
  KernelFunction, 
  KernelConfig, 
  DispatchOptions, 
  BufferView,
  WorkgroupSize,
  GPUBackend 
} from './types';
```

### GPUContext
```typescript
class GPUContext {
  static async create(options?: ContextOptions): Promise<GPUContext>;
  
  readonly device: GPUDevice;
  readonly adapter: GPUAdapter;
  readonly features: Set<string>;
  readonly limits: GPUSupportedLimits;
  
  createKernel(fn: KernelFunction, config?: KernelConfig): Kernel;
  createBufferPool(options: BufferPoolOptions): BufferPool;
  
  // DevTools
  devtools: DevToolsClient;
  
  // Cleanup
  destroy(): void;
}
```

### Kernel
```typescript
class Kernel<Input extends readonly GPUBufferView[], Output> {
  readonly wgsl: string;
  readonly bindGroupLayout: GPUBindGroupLayout;
  readonly pipeline: GPUComputePipeline;
  
  dispatch(inputs: Input, options?: DispatchOptions): DispatchHandle<Output>;
  dispatchSync(inputs: Input, options?: DispatchOptions): Promise<Output>;
  
  // Introspection
  getWorkgroupSize(): [number, number, number];
  getBindingLayout(): BindingLayoutEntry[];
}
```

---

## Data Models

### Transpilation Result
```typescript
interface TranspilationResult {
  wgsl: string;
  bindings: BindingLayoutEntry[];
  workgroupSize: [number, number, number];
  uniforms: UniformLayout;
  diagnostics: Diagnostic[];  // Warnings, unsupported features
}
```

### BindingLayoutEntry
```typescript
interface BindingLayoutEntry {
  binding: number;
  visibility: GPUShaderStage.COMPUTE;
  buffer?: { type: 'read-only-storage' | 'storage' | 'uniform'; minBindingSize?: number };
  texture?: GPUTextureBindingLayout;
  sampler?: GPUSamplerBindingLayout;
}
```

---

## Testing Strategy

### Unit Tests (Vitest) - Target: 90% coverage
- **Transpiler**: 50+ JS patterns → WGSL snapshots
- **Binding Manager**: Layout generation, update queue, cache invalidation
- **Buffer Pool**: Allocation, return, pressure eviction, leak detection
- **Dispatch**: Workgroup calculation, barrier insertion, readback
- **Compat**: Feature detection matrix, polyfill correctness

### E2E Tests (Playwright + Real GPU)
- **CI Runner**: GitHub Actions `ubuntu-latest` with `--enable-webgpu` Chrome flag
- **Test Cases**: 
  - Matrix multiplication (correctness vs CPU)
  - Particle system (10k particles, 60fps)
  - Image convolution (separable filter)
  - Reduction (sum, min, max of 1M elements)
  - Prefix scan (Blelloch algorithm)
- **Cross-browser**: Manual test matrix on Chrome, Safari, Firefox, Edge

### Visual Regression
- DevTools panel screenshots at each tab
- Playground demos render correctly

### Fuzzing
- Random valid JS functions → transpile → WGSL validates → executes without crash

---

## Security Considerations

- **No Shader Code Injection**: User code transpiled, not eval'd
- **Buffer Bounds**: All accesses validated via `minBindingSize`, runtime bounds checks in debug
- **Resource Limits**: Enforce `maxStorageBufferBindingSize`, `maxComputeWorkgroupsPerDimension`
- **No Persistent GPU Memory**: All buffers released on context destroy
- **DevTools Communication**: `chrome.runtime.sendMessage` only, no external network

---

## Performance Budgets

| Metric | Target |
|--------|--------|
| Transpile 100-line kernel | < 50ms |
| Pipeline creation (cached) | < 5ms |
| Dispatch overhead (CPU) | < 100µs |
| Buffer pool hit rate | > 95% |
| DevTools panel load | < 200ms |
| Bundle size (core) | < 50 KB gzipped |
| Bundle size (devtools) | < 100 KB gzipped |

---

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
jobs:
  lint-typecheck-test:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, pnpm lint, pnpm typecheck, pnpm test]
  
  e2e-webgpu:
    runs-on: ubuntu-latest
    # Requires Chrome with WebGPU enabled
    steps: [checkout, setup-node, pnpm install, pnpm build, pnpm test:e2e]
    env:
      CHROME_FLAGS: '--enable-webgpu --enable-unsafe-webgpu'
  
  devtools-extension:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, pnpm build:devtools]
  
  publish:
    needs: [lint-typecheck-test, e2e-webgpu, devtools-extension]
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, pnpm install, pnpm build, npm publish]
```

---

## Documentation Structure

```
docs/
├── guide/
│   ├── getting-started.md
│   ├── writing-kernels.md
│   ├── binding-management.md
│   ├── memory-management.md
│   ├── devtools.md
│   ├── cross-browser.md
│   └── migration.md
├── api/
│   ├── context.md
│   ├── kernel.md
│   ├── binding-manager.md
│   ├── buffer-pool.md
│   └── devtools.md
├── reference/
│   ├── supported-js-features.md
│   ├── type-mapping.md
│   ├── limits.md
│   └── error-codes.md
├── examples/
│   ├── matrix-multiplication.md
│   ├── particle-system.md
│   ├── image-processing.md
│   ├── prefix-scan.md
│   └── physics-simulation.md
└── contributing.md
```

---

## Review Gates (8+ Rounds)

| Round | Focus | Gate Criteria |
|-------|-------|---------------|
| 1 | Spec Review | This SPEC approved |
| 2 | Transpiler | 50+ JS patterns → correct WGSL, type-safe |
| 3 | Binding + Memory | Buffer pool zero-leak, binding cache hit >95% |
| 4 | Dispatch | Kernels execute correctly, readback matches CPU |
| 5 | DevTools | Panel loads, shows kernels/buffers/dispatches |
| 6 | Cross-Browser | Works on Chrome, Safari, Firefox, Edge (manual) |
| 7 | Performance | Budgets met, no memory leaks in 1hr stress test |
| 8 | Security | Bounds checks, resource limits, no injection |
| 9 | Docs | All guides, API reference, examples complete |
| 10 | Release | CI green, npm publish, extension store ready |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebGPU API changes | Low | High | Track spec, feature detection, version pinning |
| Transpiler complexity | High | High | Incremental: start with subset, expand via tests |
| DevTools extension review | Medium | Medium | Follow MV3 guidelines, minimal permissions |
| Browser bugs (WebGPU) | High | Medium | Workarounds in compat layer, extensive test matrix |
| Shader compilation errors | High | Low | Rich diagnostics, WGSL validation pre-dispatch |

---

## Success Metrics

| Metric | 30 Days | 90 Days | 1 Year |
|--------|---------|---------|--------|
| GitHub Stars | 500 | 3,000 | 12,000 |
| npm Downloads/week | 2,000 | 15,000 | 50,000 |
| DevTools Installs | 100 | 1,000 | 5,000 |
| Playground Sessions | 1,000 | 10,000 | 50,000 |
| Community Kernels | 0 | 20 | 100 |

---

**SPEC Status**: DRAFT v0.1 - Pending PM Review Gate 1  
**Next Action**: PM approval → Phase 2 implementation begins