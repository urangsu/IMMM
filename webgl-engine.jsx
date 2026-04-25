// webgl-engine.jsx — TWGL.js WebGL filter pipeline
// ping-pong FBO · GLSL shaders · MediaPipe face uniform injection

// ═══════════════════════════════════════════════════════
// VERTEX SHADER (shared)
// ═══════════════════════════════════════════════════════
const VERT_QUAD = `
attribute vec2 a_pos;
varying vec2 v_uv;
uniform float u_flipX;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  if(u_flipX > 0.5) v_uv.x = 1.0 - v_uv.x;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// ═══════════════════════════════════════════════════════
// FRAGMENT SHADERS
// ═══════════════════════════════════════════════════════
const FRAGS = {

passthrough: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_flipX;
varying vec2 v_uv;
void main(){ gl_FragColor = texture2D(u_tex, v_uv); }`,

bilateral_h: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_sigmaSpace;
uniform float u_sigmaColor;
varying vec2 v_uv;
float gauss(float x,float s){return exp(-0.5*x*x/(s*s));}
void main(){
  vec2 px=1.0/u_resolution;
  vec4 center=texture2D(u_tex,v_uv);
  vec4 sum=vec4(0.0);float w=0.0;
  for(int i=-5;i<=5;i++){
    vec4 s=texture2D(u_tex,v_uv+vec2(float(i)*px.x,0.0));
    float ww=gauss(float(i),u_sigmaSpace)*gauss(length(s.rgb-center.rgb),u_sigmaColor);
    sum+=s*ww;w+=ww;
  }
  gl_FragColor=sum/w;
}`,

bilateral_v: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_sigmaSpace;
uniform float u_sigmaColor;
varying vec2 v_uv;
float gauss(float x,float s){return exp(-0.5*x*x/(s*s));}
void main(){
  vec2 px=1.0/u_resolution;
  vec4 center=texture2D(u_tex,v_uv);
  vec4 sum=vec4(0.0);float w=0.0;
  for(int i=-5;i<=5;i++){
    vec4 s=texture2D(u_tex,v_uv+vec2(0.0,float(i)*px.y));
    float ww=gauss(float(i),u_sigmaSpace)*gauss(length(s.rgb-center.rgb),u_sigmaColor);
    sum+=s*ww;w+=ww;
  }
  gl_FragColor=sum/w;
}`,

color_adjust: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_exposure,u_contrast,u_saturation,u_temperature,u_tint,u_vibrance,u_highlights,u_shadows;
varying vec2 v_uv;
void main(){
  vec4 col=texture2D(u_tex,v_uv);
  vec3 c=col.rgb;
  c*=pow(2.0,u_exposure);
  c.r+=u_temperature*0.1; c.b-=u_temperature*0.1; c.g+=u_tint*0.05;
  c=(c-0.5)*(1.0+u_contrast)+0.5;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=mix(vec3(lum),c,1.0+u_saturation);
  float maxC=max(c.r,max(c.g,c.b)),minC=min(c.r,min(c.g,c.b));
  float sat=(maxC<0.001)?0.0:(maxC-minC)/maxC;
  c=mix(c,mix(vec3(lum),c,1.0+u_vibrance),1.0-sat);
  float br=dot(c,vec3(0.299,0.587,0.114));
  c+=u_highlights*smoothstep(0.5,1.0,br)*0.25;
  c+=u_shadows*(1.0-smoothstep(0.0,0.5,br))*0.25;
  gl_FragColor=vec4(clamp(c,0.0,1.0),col.a);
}`,

// ── Fuji Classic Negative ──────────────────────────────
classic_neg: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  // desaturate + muted palette
  vec3 d=mix(vec3(lum),c,0.72);
  // lifted blacks (film base fog)
  d=max(d,vec3(0.055,0.045,0.025));
  // cool highlights
  float hi=smoothstep(0.62,1.0,lum);
  d.b+=hi*0.07; d.r-=hi*0.035;
  // orange midtone cast
  float mid=1.0-abs(lum-0.48)*2.2;
  d.r+=mid*0.055; d.g+=mid*0.025;
  // compress dynamic range
  d=d*0.87+0.055;
  // pseudo grain
  float n=fract(sin(dot(v_uv,vec2(127.1,311.7)))*43758.5453);
  d+=mix(-0.015,0.015,n)*(1.0-lum)*0.6;
  gl_FragColor=vec4(mix(orig.rgb,clamp(d,0.0,1.0),u_intensity),orig.a);
}`,

// ── Kodak Portra 400 ──────────────────────────────────
kodak_portra: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=max(c,vec3(0.04,0.03,0.02));
  float mid=1.0-abs(lum-0.45)*2.2;
  c.r+=mid*0.045; c.g+=mid*0.018;
  float hi=smoothstep(0.68,1.0,lum);
  c=mix(c,vec3(1.0,0.97,0.94),hi*0.14);
  c=mix(vec3(lum),c,0.88);
  c=c*0.92+0.035;
  float n=fract(sin(dot(v_uv,vec2(92.3,27.8)))*31415.9);
  c+=mix(-0.01,0.01,n)*(1.0-lum)*0.4;
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

// ── Ilford HP5+ B&W ───────────────────────────────────
ilford_hp5: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  float lum=dot(orig.rgb,vec3(0.299,0.587,0.114));
  float bw=pow(lum,0.88)*1.08;
  bw=clamp(smoothstep(0.04,0.96,bw),0.0,1.0);
  // strong grain on shadow
  float n=fract(sin(dot(v_uv,vec2(431.7,182.3)))*21341.7);
  bw+=mix(-0.025,0.025,n)*(1.0-bw)*0.9;
  gl_FragColor=vec4(mix(orig.rgb,vec3(clamp(bw,0.0,1.0)),u_intensity),orig.a);
}`,

// ── Y2K ───────────────────────────────────────────────
y2k: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=mix(vec3(lum),c,1.0+0.4*u_intensity);
  c.b+=0.05*u_intensity; c.r-=0.02*u_intensity;
  c*=1.0+0.05*u_intensity;
  float hi=smoothstep(0.6,1.0,lum);
  c.b+=hi*0.06*u_intensity;
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

// ── Dream / Pastel ────────────────────────────────────
dream: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
uniform vec2 u_resolution;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=mix(c,vec3(1.0),0.18*u_intensity);
  c=mix(vec3(lum),c,0.82);
  vec2 px=4.0/u_resolution;
  vec3 glow=(texture2D(u_tex,v_uv+vec2(px.x,0)).rgb+texture2D(u_tex,v_uv-vec2(px.x,0)).rgb+texture2D(u_tex,v_uv+vec2(0,px.y)).rgb+texture2D(u_tex,v_uv-vec2(0,px.y)).rgb)/4.0;
  c=mix(c,c+glow*0.22,u_intensity*lum);
  float hi=smoothstep(0.65,1.0,lum);
  c=mix(c,c+vec3(0.05,0.02,0.08)*hi,u_intensity);
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

// ── Glitter (animated sparkles) ───────────────────────
glitter: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_intensity;
uniform vec2 u_resolution;
varying vec2 v_uv;
float hash21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);}
float flare(vec2 d,float sz){
  float dist=length(d);
  float h=(abs(d.y)<sz*0.09)?sz/(dist+0.002)*0.09:0.0;
  float v=(abs(d.x)<sz*0.09)?sz/(dist+0.002)*0.09:0.0;
  vec2 d45=vec2(d.x+d.y,d.x-d.y)*0.707;float d45l=length(d45);
  float a=(abs(d45.y)<sz*0.065)?sz/(d45l+0.002)*0.055:0.0;
  float b=(abs(d45.x)<sz*0.065)?sz/(d45l+0.002)*0.055:0.0;
  return clamp(h+v+a+b,0.0,1.0);
}
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=mix(c,c*vec3(1.1,1.07,1.05),u_intensity*0.5);
  float nl=dot(c,vec3(0.299,0.587,0.114));
  c=mix(vec3(nl),c,1.0+u_intensity*0.18);
  vec2 ar=vec2(u_resolution.x/u_resolution.y,1.0);
  vec3 spk=vec3(0.0);
  float GRID=13.0;
  vec2 cell=floor(v_uv*GRID);
  for(float dx=-1.0;dx<=1.0;dx++)for(float dy=-1.0;dy<=1.0;dy++){
    vec2 nc=cell+vec2(dx,dy);
    float h=hash21(nc);
    if(h<0.38)continue;
    vec2 jt=vec2(hash21(nc+0.1),hash21(nc+0.2))*0.4+0.3;
    vec2 ctr=(nc+jt)/GRID;
    ctr+=vec2(sin(u_time*1.4+h*6.28),cos(u_time*1.1+h*5.5))*0.007;
    float sLum=dot(texture2D(u_tex,clamp(ctr,0.001,0.999)).rgb,vec3(0.299,0.587,0.114));
    if(sLum<0.62)continue;
    float blink=0.5+0.5*sin(u_time*(2.0+h*3.5)+h*20.0);
    float sz=0.018+0.014*blink;
    vec2 d=(v_uv-ctr)*ar;
    float sp=flare(d,sz)*blink*sLum;
    spk+=sp*hsv2rgb(vec3(fract(h*1.7+u_time*0.04),0.32,1.0));
  }
  c+=spk*u_intensity*lum;
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

// ── Purikura — skin smooth + eye warp (MediaPipe) ─────
purikura: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
uniform vec2 u_resolution;
uniform vec2 u_leftEyeCenter;
uniform vec2 u_rightEyeCenter;
uniform float u_eyeRadius;
uniform float u_eyeScale;
varying vec2 v_uv;

vec2 warpEye(vec2 uv, vec2 ec, float radius, float scale){
  float ar=u_resolution.x/u_resolution.y;
  vec2 d=uv-ec;
  float dist=length(vec2(d.x*ar,d.y));
  if(dist>=radius||scale<=1.001) return uv;
  float t=smoothstep(0.0,radius,dist);
  float factor=mix(1.0/scale,1.0,t*t);
  return ec+d*factor;
}

void main(){
  vec2 uv=v_uv;
  // Eye enlargement via inverse UV mapping
  if(u_eyeRadius>0.002&&u_eyeScale>1.001){
    uv=warpEye(uv,u_leftEyeCenter,u_eyeRadius,u_eyeScale);
    uv=warpEye(uv,u_rightEyeCenter,u_eyeRadius,u_eyeScale);
    uv=clamp(uv,0.001,0.999);
  }
  vec4 orig=texture2D(u_tex,uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  // Brightness + colour
  c*=1.0+0.22*u_intensity;
  c=mix(vec3(lum),c,1.0+0.25*u_intensity);
  c.r=min(c.r+0.04*u_intensity,1.0);
  // centre glow (face area)
  float dist2=length(v_uv-vec2(0.5,0.42));
  float glow=exp(-dist2*dist2*2.5)*0.12*u_intensity;
  c+=glow*lum;
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

// ── Blush — face-landmark-aware cheek blush ───────────
blush: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_leftCheek;
uniform vec2 u_rightCheek;
uniform float u_cheekRadius;
uniform float u_blushStrength;
uniform vec3 u_blushColor;
uniform vec2 u_resolution;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float ar=u_resolution.x/u_resolution.y;
  vec2 uv=vec2(v_uv.x*ar,v_uv.y);
  float dL=length(uv-vec2(u_leftCheek.x*ar,u_leftCheek.y));
  float dR=length(uv-vec2(u_rightCheek.x*ar,u_rightCheek.y));
  float fL=pow(1.0-smoothstep(0.0,u_cheekRadius,dL),2.0);
  float fR=pow(1.0-smoothstep(0.0,u_cheekRadius,dR),2.0);
  float blush=(fL+fR)*u_blushStrength;
  vec3 screened=c+u_blushColor-c*u_blushColor;
  c=mix(c,screened,clamp(blush*0.65,0.0,1.0));
  // Warm lift + slight desat
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c=mix(vec3(lum),c,0.88);
  c*=1.05; c.r=min(c.r+0.02,1.0);
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),1.0),orig.a);
}`,

// ── Smooth (strong bilateral + warm lift) ─────────────
smooth_skin: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c*=1.0+0.1*u_intensity;
  c.r=min(c.r+0.015*u_intensity,1.0);
  c=mix(vec3(lum),c,1.0-0.08*u_intensity);
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

// ── Porcelain (velvety skin) ───────────────────────────
porcelain: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  c*=1.08; c=mix(vec3(lum),c,0.88);
  c.r=min(c.r+0.025,1.0); c.g=min(c.g+0.01,1.0);
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

};

// ═══════════════════════════════════════════════════════
// Filter pipeline presets
// ═══════════════════════════════════════════════════════
const FILTER_PIPELINES = {
  original:  { pipeline:[] },

  porcelain: { pipeline:[
    { shader:'bilateral_h', uniforms:{ u_sigmaSpace:3.0, u_sigmaColor:0.12 } },
    { shader:'bilateral_v', uniforms:{ u_sigmaSpace:3.0, u_sigmaColor:0.12 } },
    { shader:'porcelain',   uniforms:{ u_intensity:1.0 } },
    { shader:'color_adjust',uniforms:{ u_exposure:0.08,u_contrast:-0.06,u_saturation:-0.08,u_temperature:0.2,u_tint:0,u_vibrance:0,u_highlights:0.04,u_shadows:0.02 } },
  ]},

  y2k:  { pipeline:[{ shader:'y2k',  uniforms:{ u_intensity:1.0 } }] },
  bw:   { pipeline:[{ shader:'ilford_hp5', uniforms:{ u_intensity:1.0 } }] },
  grain:{ pipeline:[{ shader:'classic_neg',uniforms:{ u_intensity:1.0 } }] },
  vintage:{ pipeline:[{ shader:'kodak_portra',uniforms:{ u_intensity:1.0 } }] },
  dream:{ pipeline:[{ shader:'dream', uniforms:{ u_intensity:1.0 } }] },

  glitter: { pipeline:[
    { shader:'color_adjust', uniforms:{ u_exposure:0.1,u_saturation:0.28,u_contrast:0.04,u_temperature:0,u_tint:0,u_vibrance:0.15,u_highlights:0.08,u_shadows:0 } },
    { shader:'glitter',      uniforms:{ u_time:0.0, u_intensity:0.9 } }, // u_time injected per frame
  ]},

  purikura: { pipeline:[
    { shader:'bilateral_h', uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.15 } },
    { shader:'bilateral_v', uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.15 } },
    { shader:'purikura',    uniforms:{ u_intensity:1.0, u_eyeRadius:0.0, u_eyeScale:1.0,
        u_leftEyeCenter:[0.35,0.40], u_rightEyeCenter:[0.65,0.40] } },
  ]},

  smooth: { pipeline:[
    { shader:'bilateral_h', uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.18 } },
    { shader:'bilateral_v', uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.18 } },
    { shader:'smooth_skin', uniforms:{ u_intensity:1.0 } },
    { shader:'color_adjust',uniforms:{ u_exposure:0.08,u_contrast:-0.1,u_saturation:-0.06,u_temperature:0.15,u_tint:0,u_vibrance:0,u_highlights:0.05,u_shadows:0.05 } },
  ]},

  blush: { pipeline:[
    { shader:'color_adjust', uniforms:{ u_exposure:0.04,u_saturation:0.12,u_contrast:-0.04,u_temperature:0.18,u_tint:0,u_vibrance:0,u_highlights:0,u_shadows:0 } },
    { shader:'blush', uniforms:{
        u_leftCheek:[0.28,0.52], u_rightCheek:[0.72,0.52],
        u_cheekRadius:0.22, u_blushStrength:0.85,
        u_blushColor:[0.98,0.72,0.72],
    }},
  ]},
};

// ═══════════════════════════════════════════════════════
// FilterEngine — TWGL-based ping-pong FBO pipeline
// ═══════════════════════════════════════════════════════
class FilterEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this._destroyed = false;
    this._raf = null;
    this._fboW = 0; this._fboH = 0;

    const gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false,
      preserveDrawingBuffer: true,   // needed for canvas.toDataURL()
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL not available');
    this.gl = gl;

    if (!window.twgl) throw new Error('TWGL.js not loaded');
    this._init();
    canvas.addEventListener('webglcontextlost',      this._onLost.bind(this),     false);
    canvas.addEventListener('webglcontextrestored',  this._onRestored.bind(this), false);
  }

  _init() {
    const gl = this.gl;
    this._programs = {};
    for (const [name, frag] of Object.entries(FRAGS)) {
      try {
        this._programs[name] = twgl.createProgramInfo(gl, [VERT_QUAD, frag]);
      } catch(e) {
        console.warn('[FilterEngine] shader compile failed:', name, e.message);
      }
    }
    this._bufInfo = twgl.createBufferInfoFromArrays(gl, {
      a_pos: { numComponents:2, data: new Float32Array([-1,-1, 1,-1, -1,1, 1,1]) },
    });
    this._srcTex = twgl.createTexture(gl, {
      width:2, height:2, minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, flipY:false,
    });
    this._fboInfos = [null, null];
  }

  _ensureFbos(w, h) {
    if (this._fboW === w && this._fboH === h) return;
    this._fboW = w; this._fboH = h;
    const gl = this.gl;
    const spec = [{ format:gl.RGBA, type:gl.UNSIGNED_BYTE, min:gl.LINEAR, wrap:gl.CLAMP_TO_EDGE }];
    if (!this._fboInfos[0]) {
      this._fboInfos[0] = twgl.createFramebufferInfo(gl, spec, w, h);
      this._fboInfos[1] = twgl.createFramebufferInfo(gl, spec, w, h);
    } else {
      twgl.resizeFramebufferInfo(gl, this._fboInfos[0], spec, w, h);
      twgl.resizeFramebufferInfo(gl, this._fboInfos[1], spec, w, h);
    }
  }

  _pass(shaderName, inputTex, outputFbo, uniforms) {
    const gl = this.gl;
    const prog = this._programs[shaderName];
    if (!prog) return;
    twgl.bindFramebufferInfo(gl, outputFbo);
    if (outputFbo) gl.viewport(0, 0, outputFbo.width, outputFbo.height);
    else           gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(prog.program);
    twgl.setBuffersAndAttributes(gl, prog, this._bufInfo);
    twgl.setUniforms(prog, { u_tex: inputTex, ...uniforms });
    twgl.drawBufferInfo(gl, this._bufInfo, gl.TRIANGLE_STRIP);
  }

  render(source, pipeline, w, h, mirrorX, faceUniforms) {
    if (this._destroyed) return;
    const gl = this.gl;
    if (this.canvas.width !== w)  this.canvas.width  = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this._ensureFbos(w, h);

    // Upload video frame
    gl.bindTexture(gl.TEXTURE_2D, this._srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); } catch(_){}

    const res = [w, h];
    const fu  = faceUniforms || {};
    let curTex = this._srcTex;
    let idx = 0;

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];
      const out  = this._fboInfos[1 - idx];
      this._pass(step.shader, curTex, out, {
        u_resolution: res,
        u_flipX: (i === 0 && mirrorX) ? 1.0 : 0.0,
        ...step.uniforms,
        ...fu,
      });
      curTex = out.attachments[0];
      idx = 1 - idx;
    }

    // Final blit to screen
    this._pass('passthrough', curTex, null, {
      u_resolution: res,
      u_flipX: (pipeline.length === 0 && mirrorX) ? 1.0 : 0.0,
    });
  }

  startLoop(getSource, getParams, getSize) {
    this._getSource = getSource;
    this._getParams = getParams;
    this._getSize   = getSize;
    const tick = () => {
      if (this._destroyed) return;
      const src = getSource();
      if (src && src.readyState >= 2 && src.videoWidth > 0) {
        const { w, h, mirrorX }       = getSize();
        const { pipeline, faceUniforms } = getParams();
        this.render(src, pipeline, w, h, mirrorX, faceUniforms);
      }
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop()    { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
  destroy() { this._destroyed = true; this.stop(); }

  _onLost(e)      { e.preventDefault(); this.stop(); }
  _onRestored()   { this._init(); if (this._getSource) this.startLoop(this._getSource, this._getParams, this._getSize); }
}

// ═══════════════════════════════════════════════════════
// useFilterEngine — React hook
// ═══════════════════════════════════════════════════════
function useFilterEngine(canvasRef, videoRef, filterKey, faceDataRef) {
  const engineRef    = React.useRef(null);
  const filterKeyRef = React.useRef(filterKey);
  const [webglOk, setWebglOk] = React.useState(false);

  React.useEffect(() => { filterKeyRef.current = filterKey; }, [filterKey]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine;
    try {
      engine = new FilterEngine(canvas);
      engineRef.current = engine;
      setWebglOk(true);
    } catch(e) {
      console.warn('[IMMM] WebGL init failed:', e.message);
      return;
    }

    engine.startLoop(
      () => {
        const v = videoRef.current;
        return (v && v.readyState >= 2 && v.videoWidth > 0) ? v : null;
      },
      () => {
        const key  = filterKeyRef.current;
        const preset = FILTER_PIPELINES[key] || { pipeline:[] };
        const time = performance.now() / 1000;
        const face = faceDataRef?.current;

        // Dynamic face uniforms
        let faceUniforms = {};
        if (face?.detected) {
          if (key === 'purikura') {
            faceUniforms = {
              u_leftEyeCenter:  face.leftEyeCenter,
              u_rightEyeCenter: face.rightEyeCenter,
              u_eyeRadius:      face.eyeRadius,
              u_eyeScale:       1.38,
            };
          }
          if (key === 'blush') {
            faceUniforms = {
              u_leftCheek:      face.leftCheek,
              u_rightCheek:     face.rightCheek,
              u_cheekRadius:    face.cheekRadius,
              u_blushStrength:  0.9,
              u_blushColor:     [0.98, 0.72, 0.72],
            };
          }
        }

        const pipeline = preset.pipeline.map(step =>
          step.shader === 'glitter'
            ? { ...step, uniforms: { ...step.uniforms, u_time: time } }
            : step
        );
        return { pipeline, faceUniforms };
      },
      () => {
        // Render at canvas CSS size (avoids distortion mismatch)
        const c = canvasRef.current;
        const r = c?.getBoundingClientRect();
        const W = r ? Math.max(16, Math.round(r.width))  : 480;
        const H = r ? Math.max(16, Math.round(r.height)) : 480;
        return { w: W, h: H, mirrorX: true };
      }
    );

    return () => { engine.destroy(); engineRef.current = null; };
  }, []);

  return { engineRef, webglOk };
}

Object.assign(window, { FilterEngine, useFilterEngine, FILTER_PIPELINES });
