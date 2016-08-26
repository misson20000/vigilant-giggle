attribute vec3 vertPos;
attribute vec4 color;

uniform mat4 matrix;

varying vec4 vColor;

void main(void) {
  gl_Position = matrix * vec4(vertPos, 1.0);
  vColor = color;
}
