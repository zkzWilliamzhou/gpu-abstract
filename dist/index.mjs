/**
 * GPU Abstract - WebGPU Compute Shader Abstraction Library
 */

export class GPUCompute {
  constructor(device) {
    this.device = device;
  }

  async createShader(wgslCode) {
    return this.device.createShaderModule({
      code: wgslCode
    });
  }

  createPipeline(shaderModule, layout) {
    return this.device.createComputePipeline({
      layout: layout || 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });
  }
}

export function createGPUAbstract(device) {
  return new GPUCompute(device);
}
