export interface ErrorMessage {
  message: string,
  lineNum: number,
  length: number,
  linePos: number,
  offset: number,
}

const templateShader = (userFn: string) => {
  return `
// vertex stage
@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(-1.0, 3.0),
    vec2(-1.0, -1.0),
    vec2(3.0, -1.0)
  );
  return vec4f(pos[index], 0.0, 1.0);
}

@group(0) @binding(0)
var<uniform> iResolution: vec3f;

@group(0) @binding(1)
var<uniform> iTime: f32;

@group(0) @binding(2)
var<uniform> iTimeDelta: f32;

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  return mainImage(fragCoord.xy);
}

${userFn}`;
};

const lineOffset = templateShader("").split("\n").length - 1;

let pipeline: GPURenderPipeline;
export const startShader = async (initialUserFn: string) => {
  // 1. Request adapter and device
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // 2. Create reference to canvas
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu");
  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });

  // 3. Define the bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
    ]
  });

  // 4. Create uniform buffers
  const iResolutionBuffer = device.createBuffer({
    size: 3 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const iTimeBuffer = device.createBuffer({
    size: 1 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const iTimeDeltaBuffer = device.createBuffer({
    size: 1 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 5. Set static resolution value in buffer
  // TODO: make this dynamic with resize?
  device.queue.writeBuffer(iResolutionBuffer, 0, new Float32Array([720, 720, 1]));

  // 6. Create actual bind group
  const uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0, resource: { buffer: iResolutionBuffer }
      },
      {
        binding: 1, resource: { buffer: iTimeBuffer }
      },
      {
        binding: 2, resource: { buffer: iTimeDeltaBuffer }
      },
    ]
  });

  // 7. Define pipeline layout from bind group layout
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  // 8. Create function to build the render pipeline from the user-defined code
  const updateUserFn = async (userFn: string): Promise<{ success: boolean; errors?: ErrorMessage[]; }> => {
    const code = templateShader(userFn);
    const shaderModule = device.createShaderModule({ code });

    const compilationInfo = await shaderModule.getCompilationInfo()
    const errors = compilationInfo.messages
      .filter(message => message.type === 'error')
      .map(message => ({
        message: message.message.trim(),
        lineNum: message.lineNum - lineOffset,
        linePos: message.linePos,
        offset: message.offset,
        length: message.length,
      }));
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      }
    }

    const renderPipeline = device.createRenderPipeline({
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_main',
        targets: [{
          format: navigator.gpu.getPreferredCanvasFormat()
        }]
      },
      primitive: {
        topology: 'triangle-list'
      },
      layout: pipelineLayout,
    });

    pipeline = renderPipeline;
    return {
      success: true
    };
  };
  await updateUserFn(initialUserFn);

  // 9. Create the render loop function
  const startTimeMs = Date.now();
  let lastRenderMs = startTimeMs;
  const render = () => {
    // 10. Tell WebGPU which texture to draw into
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
        clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
        view: context.getCurrentTexture().createView()
      }]
    };

    // 11. Create GPUCommandEncoder to issue commands to the GPU. This is new every animation frame.
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // 12. Update time and calculate uniforms aka "shader inputs"
    const renderTimeMs = Date.now();
    const time = (renderTimeMs - startTimeMs) / 1000;
    const timeDelta = (renderTimeMs - lastRenderMs) / 1000;
    lastRenderMs = renderTimeMs;

    device.queue.writeBuffer(iTimeBuffer, 0, new Float32Array([time]));
    device.queue.writeBuffer(iTimeDeltaBuffer, 0, new Float32Array([timeDelta]));

    // 14. Tell this render pass what to do
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.draw(3);
    passEncoder.end();

    // 16. End frame by passing array of command buffers to command queue for execution
    device.queue.submit([commandEncoder.finish()]);

    // Hook into browser animation
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  return { device, updateUserFn };
}
