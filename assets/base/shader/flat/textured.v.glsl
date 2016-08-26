attribute vec3 vertPos;
attribute vec2 texCoord;

uniform mat4 matrix;

varying vec2 vTexCoord;

void main(void) {
  gl_Position = matrix * vec4(vertPos, 1.0);
  vTexCoord = texCoord;
}
