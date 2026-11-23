/**
 * GPU Abstract - WebGPU Compute Shader Abstraction Library
 */

export declare class GPUCompute {
  device: GPUDevice;
  constructor(device: GPUDevice);
  createShader(wgslCode: string): GPUShaderModule;
  createPipeline(shaderModule: GPUShaderModule, layout?: GPUPipelineLayout): GPUComputePipeline;
}

export declare function createGPUAbstract(device: GPUDevice): GPUCompute;
