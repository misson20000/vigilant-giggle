attribute vec3 vertPos;
attribute vec3 color;
attribute vec2 texCoord;

uniform mat4 matrix;

varying vec4 vColor;
varying vec2 vTexCoord;

void main(void) {
  gl_Position = matrix * vec4(vertPos, 1.0);
  vTexCoord = texCoord;
  vColor = vec4(color, 1.0);
}
