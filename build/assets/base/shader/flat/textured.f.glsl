varying lowp vec2 vTexCoord;

void main(void) {
  gl_FragColor = vec4(vTexCoord, 1.0, 1.0);
}
