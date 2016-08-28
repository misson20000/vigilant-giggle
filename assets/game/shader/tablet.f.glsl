precision lowp float;

varying lowp vec2 vTexCoord;

uniform float time;

vec4 lerp(vec4 a, vec4 b, float x) {
  return a + x * (b-a);
}

void main(void) {
  float num;
  if(vTexCoord.y < vTexCoord.x) {
    if(vTexCoord.y < 1.-vTexCoord.x) {
      num = 0.5-vTexCoord.y;
    } else {
      num = vTexCoord.x-0.5;
    }
  } else {
    if(vTexCoord.y < 1.-vTexCoord.x) {
      num = 0.5-vTexCoord.x;
    } else {
      num = vTexCoord.y-0.5;
    }
  }
  
  num = min(1., max(0., sin(num*30. - time / 70.)));
  gl_FragColor = lerp(vec4(0.7, 0.7, 1., 1.),
                      vec4(0.9, 0.9, 1., 1.),
                      num);
}
