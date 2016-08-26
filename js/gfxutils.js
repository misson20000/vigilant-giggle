export let Color = (r, g, b, a) => {
  if(typeof(r) == "string") {
    return {
      r: parseInt(r.slice(1, 3), 16) / 255.0,
      g: parseInt(r.slice(3, 5), 16) / 255.0,
      b: parseInt(r.slice(5, 7), 16) / 255.0,
      a: r.length == 7 ? 1 : parseInt(r.slice(7, 9)) / 255.0
    }
  }
  return {
    r, g, b, a
  };
};

export let Colors = {
  BLACK: Color(0, 0, 0, 1),
  WHITE: Color(1, 1, 1, 1),
  RED: Color(1, 0, 0, 1),
  GREEN: Color(0, 1, 0, 1),
  BLUE: Color(0, 0, 1, 1)
};

export let ColorUtils = {
  multRGB(color, fac) {
    color.r*= fac;
    color.g*= fac;
    color.b*= fac;
    return color;
  }
};
