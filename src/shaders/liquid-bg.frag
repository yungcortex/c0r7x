precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform vec2 uResolution;

// Simplex 3D noise
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * aspect;

  float scrollOffset = uScroll * 0.3;
  vec2 mouseInfluence = (uMouse - 0.5) * 0.15;

  // Layered noise for liquid metal
  float n1 = fbm(vec3(p * 2.0 + mouseInfluence, uTime * 0.15 + scrollOffset));
  float n2 = fbm(vec3(p * 4.0 - mouseInfluence * 0.5, uTime * 0.1 - scrollOffset * 0.5));
  float n3 = snoise(vec3(p * 1.5, uTime * 0.08 + scrollOffset * 0.7));

  float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

  // Chrome color mapping
  vec3 darkBlue = vec3(0.039, 0.039, 0.071);
  vec3 midChrome = vec3(0.35, 0.35, 0.42);
  vec3 brightChrome = vec3(0.75, 0.75, 0.82);
  vec3 highlight = vec3(0.9, 0.9, 0.95);

  float t = combined * 0.5 + 0.5;
  vec3 color;
  if (t < 0.35) {
    color = mix(darkBlue, midChrome, t / 0.35);
  } else if (t < 0.65) {
    color = mix(midChrome, brightChrome, (t - 0.35) / 0.3);
  } else {
    color = mix(brightChrome, highlight, (t - 0.65) / 0.35);
  }

  // Iridescent highlights (thin-film interference approximation)
  float iridAngle = dot(normalize(vec3(uv - 0.5, 1.0)), vec3(0.0, 0.0, 1.0));
  float film = sin(combined * 12.0 + iridAngle * 6.28) * 0.5 + 0.5;
  vec3 iridescence = vec3(
    sin(film * 6.28) * 0.03,
    sin(film * 6.28 + 2.094) * 0.03,
    sin(film * 6.28 + 4.188) * 0.03
  );
  color += iridescence * smoothstep(0.5, 0.8, t);

  // Vignette
  float vignette = 1.0 - length((uv - 0.5) * 1.3);
  vignette = smoothstep(0.0, 0.7, vignette);
  color *= vignette * 0.7 + 0.3;

  // Subtle overall darkening to keep it moody
  color *= 0.6;

  gl_FragColor = vec4(color, 1.0);
}
