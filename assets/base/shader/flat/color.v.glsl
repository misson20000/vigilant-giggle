attribute vec3 vertPos;
attribute vec3 color;

uniform mat4 matrix;

varying vec4 vColor;

void main(void) {
  gl_Position = matrix * vec4(vertPos, 1.0);
  vColor = vec4(color, 1.0);
}
