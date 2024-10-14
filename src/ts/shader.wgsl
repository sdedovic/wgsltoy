// vertex stage
@vertex
fn vertex_main(
  @builtin(vertex_index) VertexIndex: u32
) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(-1.0, 3.0),
    vec2(-1.0, -1.0),
    vec2(3.0, -1.0)
  );
  let xy = pos[VertexIndex];
  return vec4f(xy, 0.0, 1.0);
}

@group(0) @binding(0)
var<uniform> iResolution: vec3f;

@group(0) @binding(1)
var<uniform> iTime: f32;

@group(0) @binding(2)
var<uniform> iTimeDelta: f32;

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
	let uv = fragCoord.xy / iResolution.xy;
	let col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3f(0, 2, 4));
  return vec4(col, 1.0);
}
