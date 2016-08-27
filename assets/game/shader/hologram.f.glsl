precision lowp float;

varying lowp vec4 vColor;

uniform float time;
uniform float pixwidth;
uniform float pixheight;

void main(void) {
  float wave = sin(sin(gl_FragCoord.x/10. + time/30.)/2. + gl_FragCoord.y - time/30.);
  wave = max(0., wave);
  wave = min(1., wave);
  gl_FragColor = vColor * vec4(wave/5. + 0.5, wave/5. + 0.5, 1., 1.);
}
