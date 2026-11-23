const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

// 确保dist目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 读取源码
const srcFile = path.join(srcDir, 'index.js');
const content = fs.readFileSync(srcFile, 'utf8');

// 写入构建产物
fs.writeFileSync(path.join(distDir, 'index.js'), content);
fs.writeFileSync(path.join(distDir, 'index.mjs'), content);

// 生成类型声明
const dtsContent = `/**
 * GPU Abstract - WebGPU Compute Shader Abstraction Library
 */

export declare class GPUCompute {
  device: GPUDevice;
  constructor(device: GPUDevice);
  createShader(wgslCode: string): GPUShaderModule;
  createPipeline(shaderModule: GPUShaderModule, layout?: GPUPipelineLayout): GPUComputePipeline;
}

export declare function createGPUAbstract(device: GPUDevice): GPUCompute;
`;

fs.writeFileSync(path.join(distDir, 'index.d.ts'), dtsContent);

console.log('✅ Build complete!');
