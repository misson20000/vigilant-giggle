precision lowp float;

varying lowp vec4 vColor;

uniform float time;
uniform float pixwidth;
uniform float pixheight;

vec4 lerp(vec4 a, vec4 b, float x) {
  return a + x * (b-a);
}

void main(void) {
  float wave = sin(sin(gl_FragCoord.x/10. + time/30.)/2. + gl_FragCoord.y - time/30.);
  wave = max(0., wave);
  wave = min(1., wave);
  gl_FragColor = lerp(vColor, vec4(0.5, 0.5, 1., 0.2), wave/2.+0.5);
}
