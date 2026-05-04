// webgl-engine.jsx — TWGL.js WebGL filter pipeline
// ping-pong FBO | GLSL shaders | MediaPipe face uniform injection

/**
 * 🚀 PHASE B — WebGL Masked Skin Retouch (Design)
 * ─────────────────────────────────────────────────────────────────────────────
 * [GOAL] 
 *   인위적인 블러가 아닌, 피부 톤의 균일도를 높이는 자연스러운 보정 구현.
 *   얼굴 외곽과 배경의 경계선 왜곡(Denting)이 절대 발생하지 않는 합성 지향.
 * 
 * [TEXTURE STRATEGY]
 *   1. originalTexture: 원본 카메라 입력 (u_tex)
 *   2. blurredTexture: Downsampled Gaussian/Bilateral blur pass (저해상도 FBO)
 *   3. skinMask: Landmark 기반 ROI 또는 Procedural skin-tone mask
 *   4. skinRetouchComposite: mix(original, blurred, mask * strength)
 * 
 * [PERFORMANCE OPTIMIZATION]
 *   - Early-Exit: strength 가 0이면 해당 pass 전체 skip.
 *   - Downsampling: Blur 연산은 1/2 또는 1/4 해상도 FBO에서 수행.
 *   - Throttling: Landmark 업데이트는 10~15fps 제한.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// 
// VERTEX SHADER (shared)
// 
const VERT_QUAD = `
attribute vec2 a_pos;
varying vec2 v_uv;
uniform float u_flipX;
uniform float u_flipY;
uniform float u_coverCrop;
uniform vec2 u_srcResolution;
uniform vec2 u_dstResolution;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  if(u_coverCrop > 0.5 && u_srcResolution.x > 0.0 && u_srcResolution.y > 0.0 && u_dstResolution.x > 0.0 && u_dstResolution.y > 0.0){
    float srcAspect = u_srcResolution.x / u_srcResolution.y;
    float dstAspect = u_dstResolution.x / u_dstResolution.y;
    if(srcAspect > dstAspect){
      float visibleW = dstAspect / srcAspect;
      v_uv.x = 0.5 + (v_uv.x - 0.5) * visibleW;
    } else {
      float visibleH = srcAspect / dstAspect;
      v_uv.y = 0.5 + (v_uv.y - 0.5) * visibleH;
    }
  }
  if(u_flipY > 0.5) v_uv.y = 1.0 - v_uv.y;
  if(u_flipX > 0.5) v_uv.x = 1.0 - v_uv.x;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// 
// FRAGMENT SHADERS
// 
const FRAGS = {
// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE CORE SHADERS — used by visible filter pipelines (porcelain/smooth/blush)
// ─────────────────────────────────────────────────────────────────────────────

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

// skin_retouch — PERMANENTLY DISABLED
skin_retouch: `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor=texture2D(u_tex,v_uv);
}`,






//  Fuji Classic Negative 
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

//  Kodak Portra 400 
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

//  Ilford HP5+ B&W 
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

//  Y2K  CRT + digital camera 2002 
y2k: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
uniform vec2 u_resolution;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.299,0.587,0.114));
  // Heavy cyan-blue cast + oversaturation (CRT monitor)
  c=mix(vec3(lum),c,1.0+0.5*u_intensity);
  c.b+=0.13*u_intensity; c.g+=0.05*u_intensity; c.r-=0.06*u_intensity;
  // Blown highlights (2002 digital camera)
  float hi=smoothstep(0.60,1.0,lum);
  c=mix(c,vec3(0.98,0.97,1.04),hi*0.22*u_intensity);
  // Edge chromatic aberration
  vec2 px=1.0/u_resolution;
  c.r=mix(c.r,texture2D(u_tex,v_uv+vec2(2.5*px.x,0.0)).r,0.45*u_intensity);
  c.b=mix(c.b,texture2D(u_tex,v_uv-vec2(2.5*px.x,0.0)).b,0.45*u_intensity);
  // Subtle CRT scanlines
  float scan=sin(v_uv.y*u_resolution.y*3.14159)*0.5+0.5;
  c*=1.0-(1.0-scan)*0.04*u_intensity;
  // Black lift (JPEG artifact feel)
  c=max(c,vec3(0.045,0.040,0.060));
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

//  Dream / Pastel 
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

//  Glitter (animated sparkles) 
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

//  Purikura  skin glow + brightness — EYE WARP PERMANENTLY DISABLED
// SAFETY: Eye warp / slimming / AR uniforms are NOT active.
// The shader only performs brightness, saturation boost, and center glow.
purikura: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
uniform vec2 u_resolution;
varying vec2 v_uv;

void main(){
  vec2 uv=v_uv;
  // NOTE: Eye warp removed. No warp logic calls.
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

//  Blush — EMERGENCY: GLOBAL WARM TINT (NON-LANDMARK)
// SAFETY: Removed landmark awareness (cheek position) to prevent distortion.
// Now applies a subtle, natural warm pinkish lift to the entire frame.
blush: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  
  // Natural warm pink lift
  vec3 warm=vec3(1.0, 0.94, 0.92);
  c=mix(c, c+warm-c*warm, 0.08 * u_intensity);
  
  // Subtle red lift in midtones
  float lum=dot(c,vec3(0.299,0.587,0.114));
  float mid=smoothstep(0.2, 0.7, lum) * (1.0-smoothstep(0.6, 0.95, lum));
  c.r=min(c.r+0.015*u_intensity*mid, 1.0);
  
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

//  Halation pass-1 H: extract bright  horizontal Gaussian (unrolled for GLES1) 
halation_h: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_threshold;
varying vec2 v_uv;
float exB(vec3 c,float t){float l=dot(c,vec3(0.2126,0.7152,0.0722));float b=max(l-t,0.0)/max(1.0-t,0.001);return b*b;}
void main(){
  float px=1.0/u_resolution.x;
  float t=u_threshold;
  vec3 c0=texture2D(u_tex,v_uv).rgb;
  vec3 c1=texture2D(u_tex,v_uv+vec2(px*2.5,0.0)).rgb;
  vec3 cn1=texture2D(u_tex,v_uv-vec2(px*2.5,0.0)).rgb;
  vec3 c2=texture2D(u_tex,v_uv+vec2(px*5.0,0.0)).rgb;
  vec3 cn2=texture2D(u_tex,v_uv-vec2(px*5.0,0.0)).rgb;
  vec3 c3=texture2D(u_tex,v_uv+vec2(px*7.5,0.0)).rgb;
  vec3 cn3=texture2D(u_tex,v_uv-vec2(px*7.5,0.0)).rgb;
  vec3 c4=texture2D(u_tex,v_uv+vec2(px*10.0,0.0)).rgb;
  vec3 cn4=texture2D(u_tex,v_uv-vec2(px*10.0,0.0)).rgb;
  vec3 sum=c0*exB(c0,t)*0.227
    +(c1*exB(c1,t)+cn1*exB(cn1,t))*0.194
    +(c2*exB(c2,t)+cn2*exB(cn2,t))*0.121
    +(c3*exB(c3,t)+cn3*exB(cn3,t))*0.054
    +(c4*exB(c4,t)+cn4*exB(cn4,t))*0.016;
  float wt=0.227+(0.194+0.121+0.054+0.016)*2.0;
  gl_FragColor=vec4(sum/wt,1.0);
}`,

//  Halation pass-2 V: vertical Gaussian (unrolled for GLES1) 
halation_v: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
varying vec2 v_uv;
void main(){
  float py=1.0/u_resolution.y;
  vec4 c0=texture2D(u_tex,v_uv);
  vec4 c1=texture2D(u_tex,v_uv+vec2(0.0,py*2.5));
  vec4 cn1=texture2D(u_tex,v_uv-vec2(0.0,py*2.5));
  vec4 c2=texture2D(u_tex,v_uv+vec2(0.0,py*5.0));
  vec4 cn2=texture2D(u_tex,v_uv-vec2(0.0,py*5.0));
  vec4 c3=texture2D(u_tex,v_uv+vec2(0.0,py*7.5));
  vec4 cn3=texture2D(u_tex,v_uv-vec2(0.0,py*7.5));
  vec4 c4=texture2D(u_tex,v_uv+vec2(0.0,py*10.0));
  vec4 cn4=texture2D(u_tex,v_uv-vec2(0.0,py*10.0));
  vec4 sum=c0*0.227+(c1+cn1)*0.194+(c2+cn2)*0.121+(c3+cn3)*0.054+(c4+cn4)*0.016;
  float wt=0.227+(0.194+0.121+0.054+0.016)*2.0;
  gl_FragColor=sum/wt;
}`,

//  Halation pass-3 composite: screen-blend blurred bright onto original 
halation_comp: `
precision mediump float;
uniform sampler2D u_tex;      // original scene
uniform sampler2D u_halTex;   // blurred bright map (from FBO[2])
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 glow=texture2D(u_halTex,v_uv).rgb;
  // Warm tint on glow (red-orange halation like film)
  glow*=vec3(1.8,0.55,0.18);
  glow=clamp(glow*u_intensity,0.0,1.0);
  // Screen blend
  vec3 c=orig.rgb+glow-orig.rgb*glow;
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

//  Legacy single-pass halation (kept for fallback) 
halation: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform float u_threshold;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec2 px=1.0/u_resolution;
  vec3 glow=vec3(0.0); float wt=0.0;
  for(int i=-3;i<=3;i++){
    float fi=float(i);
    float w=exp(-0.5*fi*fi/3.5);
    vec3 sh=texture2D(u_tex,v_uv+vec2(fi*px.x*4.0,0.0)).rgb;
    float lh=dot(sh,vec3(0.2126,0.7152,0.0722));
    float bh=max(lh-u_threshold,0.0)/(1.0-u_threshold);
    glow+=bh*bh*vec3(1.8,0.55,0.18)*w;
    vec3 sv=texture2D(u_tex,v_uv+vec2(0.0,fi*px.y*4.0)).rgb;
    float lv=dot(sv,vec3(0.2126,0.7152,0.0722));
    float bv=max(lv-u_threshold,0.0)/(1.0-u_threshold);
    glow+=bv*bv*vec3(1.8,0.55,0.18)*w;
    wt+=w*2.0;
  }
  glow=(glow/wt)*u_intensity;
  vec3 c=orig.rgb+glow-orig.rgb*glow;
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

//  Split Tone  shadow/highlight colour toning 
split_tone: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec3 u_shadowColor;
uniform vec3 u_highlightColor;
uniform float u_intensity;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec3 c=orig.rgb;
  float lum=dot(c,vec3(0.2126,0.7152,0.0722));
  c=c*mix(u_shadowColor,vec3(1.0),smoothstep(0.0,0.5,lum))
      *mix(vec3(1.0),u_highlightColor,smoothstep(0.5,1.0,lum));
  gl_FragColor=vec4(mix(orig.rgb,clamp(c,0.0,1.0),u_intensity),orig.a);
}`,

//  Film Grain v2  temporal, midtone-masked 
film_grain_v2: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_amount;
varying vec2 v_uv;
float rand(vec2 co){return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  float lum=dot(orig.rgb,vec3(0.2126,0.7152,0.0722));
  float t=floor(u_time*24.0);
  vec2 uv_g=floor(v_uv*512.0)/512.0;
  float g=(rand(uv_g+t*0.01)+rand(uv_g*1.7+t*0.013+0.5))*0.5-0.5;
  float mask=pow(1.0-abs(lum*2.0-1.0),0.7);
  vec3 c=orig.rgb+g*u_amount*mask;
  float gl=dot(c,vec3(0.2126,0.7152,0.0722));
  c=mix(c,vec3(gl),abs(g)*u_amount*0.3);
  gl_FragColor=vec4(clamp(c,0.0,1.0),orig.a);
}`,

//  Vignette  standalone radial darkening 
vignette: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_strength;
varying vec2 v_uv;
void main(){
  vec4 orig=texture2D(u_tex,v_uv);
  vec2 uv=v_uv*2.0-1.0;
  float v=1.0-dot(uv,uv)*u_strength*0.55;
  v=clamp(pow(v,1.8),0.0,1.0);
  gl_FragColor=vec4(orig.rgb*v,orig.a);
}`,

//  Chromatic Aberration  lateral RGB channel offset 
chromatic_ab: `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_amount;
varying vec2 v_uv;
void main(){
  vec2 center=v_uv-0.5;
  float dist=length(center);
  float ca=u_amount*(1.0+dist*1.8);
  vec2 dir=normalize(center+0.0001);
  float r=texture2D(u_tex,v_uv+dir*ca).r;
  float g=texture2D(u_tex,v_uv).g;
  float b=texture2D(u_tex,v_uv-dir*ca).b;
  gl_FragColor=vec4(r,g,b,texture2D(u_tex,v_uv).a);
}`,

//  Smooth (strong bilateral + warm lift) 
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

//  Skin Lift  SNOW-style blemish/acne suppression + even skin tone 
//  Works AFTER bilateral blur: detects pixels still darker than
//  their neighborhood and lifts them toward the local mean.
skin_lift: `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_strength;
varying vec2 v_uv;
void main(){
  vec2 px=1.0/u_resolution;
  vec4 center=texture2D(u_tex,v_uv);
  // Gather neighbourhood (9 samples, radius 4-8px — sparse for performance)
  vec3 s=center.rgb;
  s+=texture2D(u_tex,v_uv+vec2(px.x*4.0, 0.0)).rgb;
  s+=texture2D(u_tex,v_uv-vec2(px.x*4.0, 0.0)).rgb;
  s+=texture2D(u_tex,v_uv+vec2(0.0, px.y*4.0)).rgb;
  s+=texture2D(u_tex,v_uv-vec2(0.0, px.y*4.0)).rgb;
  s+=texture2D(u_tex,v_uv+vec2(px.x*8.0, 0.0)).rgb;
  s+=texture2D(u_tex,v_uv-vec2(px.x*8.0, 0.0)).rgb;
  s+=texture2D(u_tex,v_uv+vec2(0.0, px.y*8.0)).rgb;
  s+=texture2D(u_tex,v_uv-vec2(0.0, px.y*8.0)).rgb;
  vec3 localMean=s/9.0;
  float clum=dot(center.rgb,vec3(0.299,0.587,0.114));
  float mlum=dot(localMean,vec3(0.299,0.587,0.114));
  // Dark-spot detection: pixel is darker than surroundings => spot/acne
  float deficit=max(mlum-clum-0.015,0.0); // ignore tiny normal variation
  float liftFactor=clamp(deficit*5.0,0.0,0.92)*u_strength;
  vec3 c=mix(center.rgb,localMean,liftFactor);
  // Warm skin-tone lift: gently raise shadows toward peachy tone
  float br=dot(c,vec3(0.299,0.587,0.114));
  float shadowMask=1.0-smoothstep(0.0,0.50,br);
  c+=shadowMask*vec3(0.030,0.018,0.008)*u_strength;
  // Mild overall brightness & warmth
  c.r=min(c.r+0.012*u_strength,1.0);
  c.g=min(c.g+0.006*u_strength,1.0);
  gl_FragColor=vec4(clamp(c,0.0,1.0),center.a);
}`,

//  Porcelain (velvety skin) 
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

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY / EXPERIMENTAL SHADERS — face warp + makeup FX; only used in hidden
// filter pipelines (glam/aurora/seoul/purikura). NEVER called by any visible
// pipeline (original / porcelain / smooth / blush / grain / bw).
// ─────────────────────────────────────────────────────────────────────────────

// lip_color — PERMANENTLY DISABLED
lip_color: `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor=texture2D(u_tex,v_uv);
}`,

// face_slim — PERMANENTLY DISABLED
face_slim: `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor=texture2D(u_tex,v_uv);
}`,

//  Eye Bright — PERMANENTLY DISABLED
eye_bright: `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor=texture2D(u_tex,v_uv);
}`,

// contour — PERMANENTLY DISABLED
contour: `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main(){
  gl_FragColor=texture2D(u_tex,v_uv);
}`,

  };

// 
// Filter pipeline presets
// 
const FILTER_PIPELINES = {
// ─────────────────────────────────────────────────────────────────────────────
// VISIBLE FILTER PIPELINES — shown in the filter carousel to all users.
// Rules: no face_slim / lip_color / eye_bright / contour / purikura warp calls.
// ─────────────────────────────────────────────────────────────────────────────
  original: { pipeline:[] },

  //   Window Light — 1×bilateral, lighter than smooth, natural light feel, no warp
  porcelain: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.11 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.11 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.65 } },
    { shader:'porcelain',    uniforms:{ u_intensity:1.0 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.96,0.97,1.02], u_highlightColor:[1.02,1.01,0.98], u_intensity:0.38 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.07,u_contrast:-0.04,u_saturation:-0.06,u_temperature:0.12,u_tint:0,u_vibrance:0,u_highlights:0.03,u_shadows:0.02 } },
  ]},

  //  2002 (Y2K) 
  y2k: { pipeline:[
    { shader:'y2k',          uniforms:{ u_intensity:1.0 } },
    { shader:'chromatic_ab', uniforms:{ u_amount:0.003 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.022 } },
  ]},

  //    (B&W) 
  bw: { pipeline:[
    { shader:'ilford_hp5',   uniforms:{ u_intensity:1.0 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.065 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.05, u_contrast:0.18, u_saturation:-1.0 } },
    { shader:'vignette',     uniforms:{ u_strength:0.95 } },
  ]},

  //   (Grain) 
  grain: { pipeline:[
    { shader:'classic_neg',  uniforms:{ u_intensity:1.0 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.52 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.55 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.042 } },
    { shader:'vignette',     uniforms:{ u_strength:0.65 } },
  ]},

  //    (Vintage) 
  vintage: { pipeline:[
    { shader:'kodak_portra', uniforms:{ u_intensity:1.0 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.48 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.70 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.90,0.92,1.06], u_highlightColor:[1.08,1.04,0.92], u_intensity:0.75 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.038 } },
    { shader:'vignette',     uniforms:{ u_strength:0.70 } },
  ]},

  //     (Dream) 
  dream: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:3.0, u_sigmaColor:0.12 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:3.0, u_sigmaColor:0.12 } },
    { shader:'dream',        uniforms:{ u_intensity:1.25 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.85,0.87,1.15], u_highlightColor:[1.03,1.01,1.10], u_intensity:0.85 } },
    { shader:'chromatic_ab', uniforms:{ u_amount:0.0025 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.62 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.45 } },
    { shader:'vignette',     uniforms:{ u_strength:0.65 } },
  ]},

  //   ( - Twilight) 
  twilight: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:2.0, u_sigmaColor:0.10 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:2.0, u_sigmaColor:0.10 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.65,0.72,0.95], u_highlightColor:[0.95,0.98,1.05], u_intensity:0.9 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.05,u_contrast:0.12,u_saturation:-0.15,u_temperature:-0.25,u_tint:0.05,u_vibrance:0.1,u_highlights:-0.1,u_shadows:0.15 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.045 } },
    { shader:'vignette',     uniforms:{ u_strength:0.8 } },
  ]},

  //   ( - BlurCAM) 
  blurcam: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.15 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.15 } },
    { shader:'dream',        uniforms:{ u_intensity:1.2 } },
    { shader:'halation',     uniforms:{ u_intensity:0.8, u_threshold:0.65 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.15,u_contrast:-0.1,u_saturation:0.05,u_temperature:0,u_tint:0,u_vibrance:0.2,u_highlights:0.1,u_shadows:0 } },
  ]},

  //   (Glitter) 
  glitter: { pipeline:[
    { shader:'color_adjust', uniforms:{ u_exposure:0.1,u_saturation:0.28,u_contrast:0.04,u_temperature:0,u_tint:0,u_vibrance:0.15,u_highlights:0.08,u_shadows:0 } },
    { shader:'glitter',      uniforms:{ u_time:0.0, u_intensity:0.58 } },
    { shader:'halation',     uniforms:{ u_intensity:0.35, u_threshold:0.68 } },
  ]},

  //   (Purikura) 
  purikura: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.10 } }, // 2nd pass
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.10 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.85 } },
    // SAFETY: eye warp uniforms zeroed — warpEye removed from shader
    { shader:'purikura',     uniforms:{ u_intensity:0.72 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.96,0.94,1.03], u_highlightColor:[1.04,1.02,1.02], u_intensity:0.38 } },
  ]},

  //    Cream Skin — 2×bilateral, lower sigmaSpace to preserve hair/eye edges
  smooth: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.10 } }, // 2nd pass — sharper edges
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:3.5, u_sigmaColor:0.10 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.80 } }, // blemish suppression — lighter than before
    { shader:'smooth_skin',  uniforms:{ u_intensity:0.60 } }, // reduced to avoid over-smoothing
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.95,0.96,1.02], u_highlightColor:[1.03,1.015,0.99], u_intensity:0.38 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.06,u_contrast:-0.05,u_saturation:-0.04,u_temperature:0.10,u_tint:0,u_vibrance:0,u_highlights:0.02,u_shadows:0.03 } },
  ]},

  //   First Love — 1×bilateral, blush-only, no dream/halation/warp, no face geometry change
  blush: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:5.0, u_sigmaColor:0.11 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:5.0, u_sigmaColor:0.11 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.82 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.08,u_saturation:0.05,u_contrast:-0.06,u_temperature:0.10,u_tint:0.01,u_vibrance:0.06,u_highlights:-0.03,u_shadows:0.03 } },
    { shader:'blush',        uniforms:{ u_faceCount:0.0,
        u_leftCheek0:[0,0], u_rightCheek0:[0,0], u_cheekRadius0:0.0,
        u_leftCheek1:[0,0], u_rightCheek1:[0,0], u_cheekRadius1:0.0,
        u_leftCheek2:[0,0], u_rightCheek2:[0,0], u_cheekRadius2:0.0,
        u_leftCheek3:[0,0], u_rightCheek3:[0,0], u_cheekRadius3:0.0,
        u_blushStrength:1.05, u_blushColor:[1.0,0.58,0.62] } },
  ]},

// ─────────────────────────────────────────────────────────────────────────────
// HIDDEN FILTER PIPELINES — not shown in the filter carousel.
// May use LEGACY shaders (face_slim, lip_color, eye_bright, contour, purikura warp).
// ─────────────────────────────────────────────────────────────────────────────

  //   
  golden: { pipeline:[
    { shader:'kodak_portra', uniforms:{ u_intensity:0.7 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.88,0.90,1.02], u_highlightColor:[1.12,1.06,0.88], u_intensity:0.9 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.44 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.85 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.10,u_contrast:0.06,u_saturation:0.08,u_temperature:0.35,u_tint:0,u_vibrance:0.10,u_highlights:-0.04,u_shadows:0.06 } },
    { shader:'vignette',     uniforms:{ u_strength:0.60 } },
  ]},

  //   
  lomo: { pipeline:[
    { shader:'classic_neg',  uniforms:{ u_intensity:0.8 } },
    { shader:'chromatic_ab', uniforms:{ u_amount:0.004 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.82,0.88,1.10], u_highlightColor:[1.10,1.02,0.88], u_intensity:0.8 } },
    { shader:'film_grain_v2',uniforms:{ u_time:0.0, u_amount:0.060 } },
    { shader:'vignette',     uniforms:{ u_strength:1.10 } },
  ]},

  // ─── Glam  Instagram AR-style full makeup filter ─────────────────────────
  // face_slim → skin smooth → skin lift → blush → eye_bright → lip_color → contour → halation
  glam: { pipeline:[
    // 1. Face slimming UV warp (DISABLED for emergency safety)
    // { shader:'face_slim',    uniforms:{ u_leftJaw:[0.22,0.72], u_rightJaw:[0.78,0.72], u_chin:[0.5,0.88] } },
    // 2. Skin smoothing — bilateral x2
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:6.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:6.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:4.0, u_sigmaColor:0.10 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:4.0, u_sigmaColor:0.10 } },
    // 3. Blemish suppression
    { shader:'skin_lift',    uniforms:{ u_strength:0.92 } },
    // 4. Cheek blush (face-landmark-aware, runtime-injected)
    { shader:'blush',        uniforms:{ u_faceCount:0.0,
        u_leftCheek0:[0,0], u_rightCheek0:[0,0], u_cheekRadius0:0.0,
        u_leftCheek1:[0,0], u_rightCheek1:[0,0], u_cheekRadius1:0.0,
        u_leftCheek2:[0,0], u_rightCheek2:[0,0], u_cheekRadius2:0.0,
        u_leftCheek3:[0,0], u_rightCheek3:[0,0], u_cheekRadius3:0.0,
        u_blushStrength:1.10, u_blushColor:[1.0,0.56,0.60] } },
    // 5. Eye brightening + iris sparkle (DISABLED)
    // { shader:'eye_bright',   uniforms:{ u_leftEyeCenter:[0.35,0.40], u_rightEyeCenter:[0.65,0.40], u_eyeRadius:0.08, u_brightness:1.0, u_time:0.0 } },
    // 6. Lip color — coral rose tint with gloss (DISABLED)
    // { shader:'lip_color',    uniforms:{ u_lipCenter:[0.50,0.68], u_lipRadius:0.085, u_lipColor:[0.88,0.30,0.38], u_lipStrength:0.68 } },
    // 7. Nose contour + bridge highlight (DISABLED)
    // { shader:'contour',      uniforms:{ u_noseTip:[0.50,0.60], u_noseTop:[0.50,0.48], u_contourStrength:0.9 } },
    // 8. Gentle colour grade — warm+bright
    { shader:'color_adjust', uniforms:{ u_exposure:0.10,u_contrast:-0.05,u_saturation:0.05,u_temperature:0.12,u_tint:0.02,u_vibrance:0.1,u_highlights:0.04,u_shadows:0.06 } },
    // 9. Subtle soft glow halation
    { shader:'halation_h',   uniforms:{ u_threshold:0.70 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.28 } },
    // 10. Soft centre vignette
    { shader:'vignette',     uniforms:{ u_strength:0.42 } },
  ]},

  // ─── Aurora  dreamy pastel / ombre skin ──────────────────────────────────
  aurora: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:5.5, u_sigmaColor:0.12 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.85 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.72,0.78,1.12], u_highlightColor:[1.08,1.00,1.10], u_intensity:0.88 } },
    { shader:'dream',        uniforms:{ u_intensity:1.10 } },
    { shader:'blush',        uniforms:{ u_faceCount:0.0,
        u_leftCheek0:[0,0], u_rightCheek0:[0,0], u_cheekRadius0:0.0,
        u_leftCheek1:[0,0], u_rightCheek1:[0,0], u_cheekRadius1:0.0,
        u_leftCheek2:[0,0], u_rightCheek2:[0,0], u_cheekRadius2:0.0,
        u_leftCheek3:[0,0], u_rightCheek3:[0,0], u_cheekRadius3:0.0,
        u_blushStrength:0.95, u_blushColor:[0.88,0.60,0.90] } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.08,u_contrast:-0.08,u_saturation:-0.08,u_temperature:-0.08,u_tint:0.04,u_vibrance:0.12,u_highlights:0.06,u_shadows:0.08 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.60 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.45 } },
    { shader:'chromatic_ab', uniforms:{ u_amount:0.0015 } },
    { shader:'vignette',     uniforms:{ u_strength:0.50 } },
  ]},

  // ─── Seoul  K-beauty: porcelain skin + natural warmth (no face tracking needed) ─
  seoul: { pipeline:[
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:7.0, u_sigmaColor:0.13 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:7.0, u_sigmaColor:0.13 } },
    { shader:'bilateral_h',  uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.11 } },
    { shader:'bilateral_v',  uniforms:{ u_sigmaSpace:4.5, u_sigmaColor:0.11 } },
    { shader:'skin_lift',    uniforms:{ u_strength:0.95 } },
    { shader:'smooth_skin',  uniforms:{ u_intensity:0.85 } },
    { shader:'porcelain',    uniforms:{ u_intensity:1.0 } },
    { shader:'split_tone',   uniforms:{ u_shadowColor:[0.94,0.96,1.03], u_highlightColor:[1.06,1.03,0.98], u_intensity:0.55 } },
    { shader:'color_adjust', uniforms:{ u_exposure:0.12,u_contrast:-0.08,u_saturation:-0.06,u_temperature:0.18,u_tint:0.01,u_vibrance:0.05,u_highlights:0.05,u_shadows:0.08 } },
    { shader:'halation_h',   uniforms:{ u_threshold:0.72 } },
    { shader:'halation_v',   uniforms:{} },
    { shader:'halation_comp',uniforms:{ u_intensity:0.22 } },
    { shader:'vignette',     uniforms:{ u_strength:0.38 } },
  ]},
};

// 
// FilterEngine  TWGL-based ping-pong FBO pipeline
// 
class FilterEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this._destroyed = false;
    this._raf = null;
    this._fboW = 0; this._fboH = 0;
    this._downW = 0; this._downH = 0;
    this._isMobile = false;

    const gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false,
      preserveDrawingBuffer: true,   // needed for canvas.toDataURL()
      powerPreference: 'default',    // 'high-performance' can cause issues on mobile GPUs
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
    this._fboInfos = [null, null, null];
    this._downFboInfos = [null, null];
    this._halBlurTex = null;
    this._maskTex = twgl.createTexture(gl, { width:1, height:1, data: new Uint8Array([0,0,0,255]) });
  }

  updateMask(canvas) {
    if (this._destroyed || !canvas) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this._maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  clearMask() {
    if (this._destroyed) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this._maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  }

  setMobile(value) {
    this._isMobile = Boolean(value);
  }

  _ensureFbos(w, h) {
    const gl = this.gl;
    const spec = [{ format:gl.RGBA, type:gl.UNSIGNED_BYTE, min:gl.LINEAR, wrap:gl.CLAMP_TO_EDGE }];

    // 1. Full-res FBOs
    if (this._fboW !== w || this._fboH !== h) {
      this._fboW = w; this._fboH = h;
      if (!this._fboInfos[0]) {
        this._fboInfos[0] = twgl.createFramebufferInfo(gl, spec, w, h);
        this._fboInfos[1] = twgl.createFramebufferInfo(gl, spec, w, h);
        this._fboInfos[2] = twgl.createFramebufferInfo(gl, spec, w, h);
      } else {
        twgl.resizeFramebufferInfo(gl, this._fboInfos[0], spec, w, h);
        twgl.resizeFramebufferInfo(gl, this._fboInfos[1], spec, w, h);
        twgl.resizeFramebufferInfo(gl, this._fboInfos[2], spec, w, h);
      }
    }

    // 2. Downsampled FBOs (Max 512px for mobile-heavy tasks)
    const dw = Math.round(w > h ? 512 : 512 * (w / h));
    const dh = Math.round(h > w ? 512 : 512 * (h / w));
    if (this._downW !== dw || this._downH !== dh) {
      this._downW = dw; this._downH = dh;
      if (!this._downFboInfos[0]) {
        this._downFboInfos[0] = twgl.createFramebufferInfo(gl, spec, dw, dh);
        this._downFboInfos[1] = twgl.createFramebufferInfo(gl, spec, dw, dh);
      } else {
        twgl.resizeFramebufferInfo(gl, this._downFboInfos[0], spec, dw, dh);
        twgl.resizeFramebufferInfo(gl, this._downFboInfos[1], spec, dw, dh);
      }
    }
  }

  _pass(shaderName, inputTex, outputFbo, uniforms) {
    const gl = this.gl;
    const prog = this._programs[shaderName];
    if (!prog) {
      console.warn('[GL] missing program:', shaderName);
      return false; // caller must check
    }
    twgl.bindFramebufferInfo(gl, outputFbo);
    if (outputFbo) gl.viewport(0, 0, outputFbo.width, outputFbo.height);
    else           gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(prog.program);
    twgl.setBuffersAndAttributes(gl, prog, this._bufInfo);
    twgl.setUniforms(prog, { u_tex: inputTex, ...uniforms });
    twgl.drawBufferInfo(gl, this._bufInfo, gl.TRIANGLE_STRIP);
    return true;
  }

  render(source, pipeline, w, h, mirrorX, faceUniforms, isMobile = false) {
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
    const srcRes = [source.videoWidth || w, source.videoHeight || h];
    const fu  = faceUniforms || {};
    let curTex = this._srcTex;
    let idx = 0;
    let sceneTex = this._srcTex; 

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];

      // --- T-1: 2-pass halation routing ---
      if (step.shader === 'halation_h') {
        this._pass('halation_h', curTex, this._fboInfos[2], {
          u_resolution: res,
          u_flipX: 0.0,
          u_flipY: 0.0,
          ...step.uniforms,
        });
        sceneTex = curTex; 
        continue;
      }
      if (step.shader === 'halation_v') {
        // halation_v: read FBO[2] (H-result), write to fboInfos[1-idx].
        const halVOut = 1 - idx;
        this._pass('halation_v', this._fboInfos[2].attachments[0], this._fboInfos[halVOut], {
          u_resolution: res,
          u_flipX: 0.0,
          u_flipY: 0.0,
          ...step.uniforms,
        });
        this._halBlurTex = this._fboInfos[halVOut].attachments[0];
        // advance idx so halation_comp does NOT pick the same slot
        idx = halVOut;
        continue;
      }
      if (step.shader === 'halation_comp') {
        // SAFE: write to FBO[2]
        this._pass('halation_comp', sceneTex, this._fboInfos[2], {
          u_tex: sceneTex,
          u_halTex: this._halBlurTex,
          u_flipX: 0.0,
          u_flipY: 0.0,
          ...step.uniforms,
        });
        curTex = this._fboInfos[2].attachments[0];
        idx = 0;
        continue;
      }

      if (step.shader === 'skin_retouch') {
        const useDownsample = isMobile;
        const resForBlur = useDownsample ? [this._downW, this._downH] : res;
        const blurSigma = useDownsample ? 1.4 : 2.0; 
        
        if (useDownsample) {
          // Downsample pass
          this._pass('passthrough', curTex, this._downFboInfos[0], { u_resolution: resForBlur, u_flipX:0.0, u_flipY:0.0 });
          // Blur on low-res
          this._pass('bilateral_h', this._downFboInfos[0].attachments[0], this._downFboInfos[1], {
            u_resolution: resForBlur, u_sigmaSpace: blurSigma, u_sigmaColor: 0.1, u_flipX:0.0, u_flipY:0.0
          });
          this._pass('bilateral_v', this._downFboInfos[1].attachments[0], this._downFboInfos[0], {
            u_resolution: resForBlur, u_sigmaSpace: blurSigma, u_sigmaColor: 0.1, u_flipX:0.0, u_flipY:0.0
          });
          const blurredTex = this._downFboInfos[0].attachments[0];
          
          this._pass('skin_retouch', curTex, this._fboInfos[idx], {
            u_blurredTex: blurredTex,
            u_maskTex: this._maskTex,
            u_strength: step.uniforms?.u_strength || 0.0,
            u_debugMask: step.uniforms?.u_debugMask || 0.0,
            u_flipX: 0.0, u_flipY: 0.0
          });
        } else {
          // Normal high-res blur
          this._pass('bilateral_h', curTex, this._fboInfos[2], {
            u_resolution: res, u_sigmaSpace: 2.0, u_sigmaColor: 0.1, u_flipX:0.0, u_flipY:0.0
          });
          const blurOut = 1 - idx;
          this._pass('bilateral_v', this._fboInfos[2].attachments[0], this._fboInfos[blurOut], {
            u_resolution: res, u_sigmaSpace: 2.0, u_sigmaColor: 0.1, u_flipX:0.0, u_flipY:0.0
          });
          const blurredTex = this._fboInfos[blurOut].attachments[0];
          
          const compOut = idx;
          this._pass('skin_retouch', curTex, this._fboInfos[compOut], {
            u_blurredTex: blurredTex,
            u_maskTex: this._maskTex,
            u_strength: step.uniforms?.u_strength || 0.0,
            u_debugMask: step.uniforms?.u_debugMask || 0.0,
            u_flipX: 0.0, u_flipY: 0.0
          });
        }
        curTex = this._fboInfos[idx].attachments[0];
        // Note: idx stays same, following Normal pass will flip it
        continue;
      }

      // --- Normal pass ---
      const out = this._fboInfos[1 - idx];
      const drew = this._pass(step.shader, curTex, out, {
        u_resolution: res,
        u_flipX: (i === 0 && mirrorX) ? 1.0 : 0.0,
        u_flipY: (i === 0) ? 1.0 : 0.0,
        u_coverCrop: i === 0 ? 1.0 : 0.0,
        u_srcResolution: i === 0 ? srcRes : res,
        u_dstResolution: res,
        ...step.uniforms,
        ...fu,
      });
      // Only advance curTex when the draw actually happened.
      // If _pass returned false (program missing), keep curTex so downstream
      // passes and the final blit still get a non-black texture.
      if (drew) {
        curTex = out.attachments[0];
        idx = 1 - idx;
      }
    }

    // Final blit to screen
    this._pass('passthrough', curTex, null, {
      u_resolution: res,
      u_flipX: (pipeline.length === 0 && mirrorX) ? 1.0 : 0.0,
      u_flipY: (pipeline.length === 0) ? 1.0 : 0.0,
      u_coverCrop: pipeline.length === 0 ? 1.0 : 0.0,
      u_srcResolution: pipeline.length === 0 ? srcRes : res,
      u_dstResolution: res,
    });
  }

  startLoop(getSource, getParams, getSize, onFirstFrame, onWebglFail) {
    this._getSource = getSource;
    this._getParams = getParams;
    this._getSize   = getSize;
    this._onFirstFrame = onFirstFrame;
    this._onWebglFail  = onWebglFail;
    this._firstFrameFired = false;
    this._renderedFrames  = 0;

    const tick = () => {
      if (this._destroyed) return;
      const src = getSource();
      if (src && src.readyState >= 2 && src.videoWidth > 0) {
        const { w, h, mirrorX }          = getSize();
        const { pipeline, faceUniforms } = getParams();
        this.render(src, pipeline, w, h, mirrorX, faceUniforms, this._isMobile);
        this._renderedFrames++;

        if (!this._firstFrameFired && this._renderedFrames >= 5) {
          try {
            const gl = this.gl;
            const px = new Uint8Array(4);
            // Sample center + 4 offsets to avoid dark-background false negatives
            const pts = [
              [Math.floor(w*0.5), Math.floor(h*0.5)],
              [Math.floor(w*0.3), Math.floor(h*0.4)],
              [Math.floor(w*0.7), Math.floor(h*0.4)],
              [Math.floor(w*0.5), Math.floor(h*0.7)],
            ];
            let bright = false;
            for (const [x, y] of pts) {
              gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
              if (px[0] + px[1] + px[2] > 20) { bright = true; break; }
            }
            if (bright) {
              this._firstFrameFired = true;
              onFirstFrame && onFirstFrame();
            } else if (this._renderedFrames > 90) {
              // 90 frames of genuinely black output → real failure
              this._firstFrameFired = true;
              onWebglFail && onWebglFail();
              return;
            }
          } catch (_) {
            // readPixels blocked (security policy) → trust after 90 frames
            // Never activate at 45 because we'd show a black canvas
            if (this._renderedFrames > 90) {
              this._firstFrameFired = true;
              onFirstFrame && onFirstFrame();
            }
          }
        }
      }
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  resetFirstFrame() {
    this._firstFrameFired = false;
    this._renderedFrames = 0;
  }


  stop()    { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
  destroy() {
    this._destroyed = true;
    this.stop();
    try {
      const gl = this.gl;
      if (!gl) return;
      // Delete all compiled shader programs
      if (this._programs) {
        for (const pi of Object.values(this._programs)) {
          if (pi?.program) gl.deleteProgram(pi.program);
        }
        this._programs = {};
      }
      // Delete source texture
      if (this._srcTex) { gl.deleteTexture(this._srcTex); this._srcTex = null; }
      // Delete FBO textures and framebuffers
      for (const fbo of (this._fboInfos || [])) {
        if (!fbo) continue;
        if (fbo.framebuffer) gl.deleteFramebuffer(fbo.framebuffer);
        if (fbo.attachments) fbo.attachments.forEach(t => { if (t) gl.deleteTexture(t); });
      }
      this._fboInfos = [null, null, null];
      // Lose context explicitly to free GPU memory immediately
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    } catch (_) {}
  }

  takeSnapshot(w, h, mirrorX, pipeline, faceUniforms, isMobile = false) {
    if (this._destroyed) return null;
    const src = this._getSource();
    if (!src || src.readyState < 2) return null;
    this.render(src, pipeline, w, h, mirrorX, faceUniforms, isMobile);
    return this.canvas.toDataURL('image/jpeg', 0.98);
  }

  _onLost(e)      { e.preventDefault(); this.stop(); }
  _onRestored()   { this._init(); if (this._getSource) this.startLoop(this._getSource, this._getParams, this._getSize, null); }
}

// 
// useFilterEngine  React hook
// 
function useFilterEngine(canvasRef, videoRef, filterKey, faceDataRef, disabled, mirrorX = true, mobile = false) {
  const engineRef    = React.useRef(null);
  const filterKeyRef = React.useRef(filterKey);
  const mirrorXRef = React.useRef(mirrorX);
  const [webglOk, setWebglOk]     = React.useState(false);
  const [firstFrame, setFirstFrame] = React.useState(false);
  const [webglFailed, setWebglFailed] = React.useState(false);
  const maskCanvasRef = React.useRef(null);
  const lastMaskUpdateRef = React.useRef(0);

  if (!maskCanvasRef.current && typeof document !== 'undefined') {
    const mc = document.createElement('canvas');
    mc.width = 512; mc.height = 512;
    maskCanvasRef.current = mc;
  }

  const updateRetouchMask = (faceData) => {
    if (!faceData?.detected || !maskCanvasRef.current) return false;
    const faces = faceData.faces?.length ? faceData.faces.slice(0, 4) : [faceData];
    
    let validCount = 0;
    for (const f of faces) {
      if (f.faceOval && f.faceOval.length >= 3) validCount++;
    }

    if (validCount === 0) {
      const mc = maskCanvasRef.current;
      const ctx = mc.getContext('2d');
      ctx.clearRect(0,0,512,512);
      if (engineRef.current) engineRef.current.updateMask(mc);
      return false;
    }

    const now = Date.now();
    if (now - lastMaskUpdateRef.current < 66) return true; 
    lastMaskUpdateRef.current = now;

    const mc = maskCanvasRef.current;
    const ctx = mc.getContext('2d');
    ctx.clearRect(0,0,512,512);

    const drawPoly = (pts, color, blur=0) => {
      if (!pts || pts.length < 3) return;
      ctx.save();
      if (blur > 0) ctx.filter = `blur(${blur}px)`;
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = p[0] * 512, y = p[1] * 512;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // 1. Draw all Face Ovals
    faces.forEach(f => drawPoly(f.faceOval, '#fff', 8)); // 8px for multi-face clarity

    // 2. Draw all Exclusions
    ctx.globalCompositeOperation = 'destination-out';
    faces.forEach(f => {
      drawPoly(f.leftEye,  '#fff', 4);
      drawPoly(f.rightEye, '#fff', 4);
      drawPoly(f.leftEyebrow,  '#fff', 4);
      drawPoly(f.rightEyebrow, '#fff', 4);
      drawPoly(f.lips,  '#fff', 4);
    });
    ctx.globalCompositeOperation = 'source-over';

    if (engineRef.current) engineRef.current.updateMask(mc);
    return true;
  };

  React.useEffect(() => {
    if (engineRef.current) engineRef.current.setMobile(mobile);
  }, [mobile]);

  React.useEffect(() => { filterKeyRef.current = filterKey; }, [filterKey]);
  React.useEffect(() => { mirrorXRef.current = mirrorX; }, [mirrorX]);

  // Reset firstFrame state when filter changes so the CSS fallback video 
  // shows up immediately while the engine prepares the first frame of the new filter.
  React.useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resetFirstFrame();
      setFirstFrame(false);
    }
  }, [filterKey]);


  React.useEffect(() => {
    if (disabled) {
      setWebglOk(false);
      setFirstFrame(false);
      setWebglFailed(false);
      return; // mobile: skip WebGL, use CSS filter + canvas2D capture instead
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine;
    try {
      engine = new FilterEngine(canvas);
      engineRef.current = engine;
      setWebglFailed(false);
      // NOTE: do NOT setWebglOk(true) here  wait until real pixels confirmed in onFirstFrame
    } catch(e) {
      console.warn('[IMMM] WebGL init failed:', e.message);
      setWebglFailed(true);
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

        // EMERGENCY FACE SHAPE SAFETY:
        // All face landmark processing and uniform injection are PERMANENTLY DISABLED.
        // No browser will process face coordinates or apply landmark-based shaders.
        let faceUniforms = {};

        let steps = preset.pipeline;
        if (engineRef.current?._isMobile) {
          // Mobile optimization: restrict bilateral to 1-pass only
          let hCount = 0, vCount = 0;
          steps = steps.filter(step => {
            if (step.shader === 'bilateral_h') { hCount++; return hCount <= 1; }
            if (step.shader === 'bilateral_v') { vCount++; return vCount <= 1; }
            return true;
          });
        }

        // EMERGENCY FACE SHAPE SAFETY:
        // Disabling experimental skin retouch (which uses face masks)
        // to avoid any potential distortion or boundary artifacts.
        /*
        if (enableExperimentalSkinRetouch) {
          ...
        }
        */

        const pipeline = steps.map(step =>
          (step.shader === 'glitter' || step.shader === 'film_grain_v2' || step.shader === 'eye_bright')
            ? { ...step, uniforms: { ...step.uniforms, u_time: time } }
            : step
        );
        return { pipeline, faceUniforms };
      },
      () => {
        // Render at High-DPI canvas size (capped at 2.0 for performance)
        const c = canvasRef.current;
        const r = c?.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        const W = r ? Math.max(16, Math.round(r.width * dpr))  : 480;
        const H = r ? Math.max(16, Math.round(r.height * dpr)) : 480;
        return { w: W, h: H, mirrorX: mirrorXRef.current };
      },
      () => {
        // onFirstFrame: real pixels confirmed  NOW safe to show canvas
        setWebglOk(true);
        setFirstFrame(true);
        setWebglFailed(false);
      },
      () => {
        // WebGL texImage2D 90        
        // (Samsung CSS filter GPU  ,   )
        //  WebGL , CSS   
        engine.destroy();
        engineRef.current = null;
        setWebglOk(false);
        setFirstFrame(false);
        setWebglFailed(true);
      }
    );

    return () => { engine.destroy(); engineRef.current = null; };
  }, [disabled]);

  return { engineRef, webglOk, firstFrame, webglFailed };
}

Object.assign(window, { FilterEngine, useFilterEngine, FILTER_PIPELINES });
