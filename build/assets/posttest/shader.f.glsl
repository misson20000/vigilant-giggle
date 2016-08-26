precision lowp float;

varying vec2 vTexCoord;

uniform sampler2D framebuffer;
uniform float time;
uniform float pixwidth;
uniform float pixheight;
uniform float rippleX;
uniform float rippleY;

void main(void) {
  vec2 pixsize = vec2(pixwidth, pixheight);
  vec2 pos = (vTexCoord - vec2(rippleX, rippleY)) * pixsize;
  vec2 dir = normalize(pos);
  float len = length(pos);
  float displacement = (sin(len - time/250.) / pow(1.1, len)) * pow(0.95, time/50.);
  if(len > time / 20.) {
    displacement = 0.;
  }

  vec2 offset = dir * displacement;
  
  gl_FragColor = vec4(texture2D(framebuffer, vTexCoord + offset));
  //gl_FragColor = vec4(displacement/2.+.5, 0, 0, 1);
}
