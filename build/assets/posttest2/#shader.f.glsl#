precision lowp float;

varying vec2 vTexCoord;

uniform sampler2D framebuffer;
uniform sampler2D perlin;
uniform float time;
uniform float pixwidth;
uniform float pixheight;

void main(void) {
  vec2 perlinCoords = vTexCoord + vec2((vTexCoord.x - 0.5) * 1.2 * -vTexCoord.y, 0);
  vec2 offset = (texture2D(perlin, perlinCoords + vec2(time / 60000., 0.)).rg
                 * 2.
                 - vec2(1.))
    * 10.
    / vec2(pixwidth, pixheight);
  
  //  gl_FragColor = texture2D(framebuffer, vTexCoord + offset);
  gl_FragColor = texture2D(perlin, perlinCoords + vec2(time / 60000., 0.));
}
