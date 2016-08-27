precision lowp float;

varying vec2 vTexCoord;

uniform sampler2D framebuffer;
uniform sampler2D perlin;
uniform float time;
uniform float pixwidth;
uniform float pixheight;
uniform float refY;

void main(void) {
  vec2 perlinCoords = vTexCoord + vec2((vTexCoord.x - 0.5) * 1.2 * -vTexCoord.y, 0);
  vec2 offset = (texture2D(perlin, perlinCoords + vec2(time / 60000., 0.)).rg
                 * 2.
                 - vec2(1.))
    * 20.
    * min(1., (vTexCoord.y-(1.-refY))*10.)
    / vec2(pixwidth, pixheight);
  
  gl_FragColor = texture2D(framebuffer, vTexCoord + offset) * vec4(vec3(0.6), 1.);
  //gl_FragColor = texture2D(perlin, perlinCoords + vec2(time / 60000., 0.));
  //vec2 disp = offset * vec2(pixwidth, pixheight) / 10.;
  //gl_FragColor = vec4(disp.x, 0., disp.y, 1.);
  //gl_FragColor = vec4(vTexCoord.y-refY, 0, 0, 1);
}
