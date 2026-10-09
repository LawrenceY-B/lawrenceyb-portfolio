export const vertexShader = /* glsl */ `
  attribute float aHB; attribute vec4 aRnd; attribute vec2 aUV;
  uniform sampler2D uTex; uniform float uTH, uBH;
  uniform float uA, uB, uF, uSclA, uSclB, uOpA, uOpB, uH, uHMix, uHScl, uAssemble, uTime, uMotion, uSpeed, uHover, uSize;
  uniform vec3 uOffA, uOffB, uHOff, uField, uInk, uRed, uYel; uniform vec2 uMouse;
  varying vec3 vCol; varying float vA;
  float ease(float t){ return t < .5 ? 4.*t*t*t : 1. - pow(-2.*t + 2., 3.) / 2.; }
  vec4 shp(float id){
    if (id < .5) return vec4(position, aHB * .9);
    vec2 uv = vec2((aUV.x + .5) / 256., ((id - 1.) * uBH + aUV.y + .5) / uTH);
    return texture2D(uTex, uv);
  }
  vec3 anim(vec4 s, float id){
    vec3 p = s.xyz;
    if (abs(id - 12.) < .5 && aRnd.w > .9) { p.x -= aRnd.z * 1.2 * uSpeed; }
    if (abs(id - 15.) < .5) { float h = fract(sin(floor(p.x * 30.) * 12.9898) * 43758.5); p.y += .16 * sin(uTime * 1.2 + h * 6.28) * uMotion; }
    if (abs(id - 3.) < .5 || abs(id - 1.) < .5 || abs(id - 2.) < .5) { float a = sin(uTime * .5) * .18 * uMotion; p = vec3(p.x * cos(a) + p.z * sin(a), p.y, -p.x * sin(a) + p.z * cos(a)); }
    return p;
  }
  vec3 col(float w){ float c = floor(w + 1e-4); return c < .5 ? uInk : (c < 1.5 ? uRed : uYel); }
  float bri(float w, float id){
    float b = fract(w) / .9;
    if (abs(id - 15.) < .5) {
      float h = fract(sin(floor(position.x * 0. + aRnd.w * 42.) * 12.9898) * 43758.5);
      float sweep = exp(-pow(fract(aRnd.y * .6 - uTime * .35 * uMotion + h) - .5, 2.) * 26.);
      b = clamp(b * (.45 + 1.1 * sweep), 0., 1.);
    }
    return b;
  }
  void main(){
    vec4 sa = shp(uA), sb = shp(uB);
    vec3 pa = anim(sa, uA) * uSclA + uOffA;
    vec3 pb = anim(sb, uB) * uSclB + uOffB;
    float m = ease(clamp((uF - aRnd.y * .25) / .75, 0., 1.));
    vec3 p = mix(pa, pb, m) + sin(m * 3.14159) * (aRnd.xyz - .5) * vec3(.9, .7, .8) * uMotion;
    vec3 c = mix(col(sa.w), col(sb.w), m);
    float b = mix(bri(sa.w, uA), bri(sb.w, uB), m);
    float op = mix(uOpA, uOpB, m);
    // Hover override (selected work)
    vec4 sh = shp(uH);
    float hm = ease(clamp((uHMix - aRnd.z * .25) / .75, 0., 1.));
    vec3 ph = anim(sh, uH) * uHScl + uHOff;
    p = mix(p, ph + sin(hm * 3.14159) * (aRnd.xyz - .5) * .5 * uMotion, hm);
    c = mix(c, col(sh.w), hm); b = mix(b, bri(sh.w, uH), hm);
    // Ambient dust
    float dust = step(.985, aRnd.w);
    vec3 fp = vec3((fract(aRnd.x + uTime * .006 * (.5 + aRnd.z) * uMotion) - .5) * uField.x, (aRnd.y - .5) * uField.y, (aRnd.z - .5) * 2.);
    p = mix(p, fp, dust);
    // Intro: gather from a wide cloud
    float a = ease(clamp((uAssemble - aRnd.x * .45) / .55, 0., 1.));
    vec3 scatter = (aRnd.xyz - .5) * vec3(uField.x * 1.2, uField.y * 1.2, 4.);
    p = mix(scatter, p, a);
    vec4 wp = modelMatrix * vec4(p, 1.);
    vec2 d = wp.xy - uMouse; float dist = length(d);
    float f = smoothstep(.3, 0., dist) * uHover;
    wp.xy += (dist > 1e-4 ? d / dist : vec2(0.)) * f * .18 * (.6 + aRnd.w * .8);
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    float depth = clamp(.8 + p.z * .25, .5, 1.15);
    vCol = mix(c, uInk, dust);
    gl_PointSize = mix(.9, 1.9, b) * uSize * (3.6 / -mv.z);
    vA = mix(.08, 1., pow(clamp(b, 0., 1.), 1.25)) * depth * op * mix(1., .3, dust) * mix(.25, 1., a);
  }`;

export const fragmentShader = /* glsl */ `
  varying vec3 vCol; varying float vA;
  void main(){ vec2 c = gl_PointCoord - .5; float d = dot(c, c); if (d > .25) discard; gl_FragColor = vec4(vCol, vA * .92 * smoothstep(.25, .12, d)); }`;
