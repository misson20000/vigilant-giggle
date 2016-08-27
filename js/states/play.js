import {AssetManager} from "../assetmgr.js";
import {Colors, Color, ColorUtils} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {Keyboard} from "../keyboard.js";

let colors = {
  bg: Color("#2698FC"),
  cloud: Color(0.8, 0.8, 1, 1),
  fg: Color(0.8, 0.8, 1, 1),
  dirt: Color("#5E3F1B"),
  grass: Color("#45A81E"),
  sun: Color(1, 1, 0, 1),
  moon: Color(0.8, 0.8, 0.8, 1),
  water: ColorUtils.multRGB(Color(0.8, 0.8, 1, 1), 0.2),
  stars: ColorUtils.multRGB(Color(1, 0.8, 0.8, 1), 1)
};

let Cloud = () => {
  let w = 125;
  let h = 65;

  let self = {
    draw(shapes) {
      shapes.drawColoredRect(colors.cloud, -w/2, -h/2, w/2, h/2);
      let x = -w/2;
      for(let i = 0; i < rects.length; i++) {
        shapes.drawColoredRect(colors.cloud, x-(rects[i]/2), -(h/2)-(rects[i]/2), x+(rects[i]/2), -(h/2)+(rects[i]/2));
        x+= rects[i];
      }
    }
  };
  return self;
};

export let PlayState = (game, transition) => {
  let render = game.render;
  let shapesMaterial = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  let fb = render.createFramebuffer(100); // 100 pixels of padding
  let time = 0;
  let postMatrix = Mat4.create();
  let post = render.createMaterial(AssetManager.getAsset("game.shader.reflection"), {
    framebuffer: fb.getTexture(),
    perlin: AssetManager.getAsset("game.noise.perlin"),
    matrix: postMatrix,
    time: () => {
      return time;
    },
    pixwidth: render.fbwidth,
    pixheight: render.fbheight,
    refY: () => {
      return fb.ytoc(0);
    }
  });
  let shapes = render.createShapeDrawer();

  let opMatrix = Mat4.create();
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();

  let cloud = Cloud();

  let camera = {
    x: 0,
    y: 0
  };

  let skyColor = Color(0, 0, 0, 1);
  let starColor = Color(0, 0, 0, 1);
  
  let stars = [];
  for(let i = 0; i < 1000; i++) {
    stars.push([Math.random(), Math.random()]);
  }

  let lerp = (a, b, x) => {
    return a + x * (b-a);
  };
  
  let self = {
    initialize() {
    },
    dayCycle() {
      return time / 7000.0;
    },
    moonPhase() {
      return (self.dayCycle() / 29.530588853) % 1;
    },
    skyColor() {
      let fac = Math.sin((self.dayCycle() + 0.25)* Math.PI * 2) / 2 + 0.5;
      fac+= 0.1;
      fac = Math.min(fac, 1);
      skyColor.r = colors.bg.r * fac;
      skyColor.g = colors.bg.g * fac;
      skyColor.b = colors.bg.b * fac;
      return skyColor;
    },
    starColor() {
      let fac = Math.sin((self.dayCycle() + 0.25)* Math.PI * 2) / 2 + 0.5;
      fac = 1-fac; // 1 at night
      fac-= 0.5;
      fac*= 2;
      fac = Math.max(0, fac);
      starColor.r = lerp(skyColor.r, colors.stars.r, fac);
      starColor.g = lerp(skyColor.g, colors.stars.g, fac);
      starColor.b = lerp(skyColor.b, colors.stars.b, fac);
      //starColor = colors.stars;
    },
    drawScene() {
      render.clear(self.skyColor());
      matStack.push(matrix);
      
      opMatrix.load.translate(render.width()/2, render.height(), 0);
      matrix.multiply(opMatrix);

      self.starColor();
      for(let i = 0; i < stars.length; i++) {
        let star = stars[i];
        shapes.drawColoredRect(starColor,
                               (render.width() * star[0]) - 1.0 - render.width()/2,
                               (-render.height() * star[1]) - 1.0,
                               (render.width() * star[0]) + 1.0 - render.width()/2,
                               (-render.height() * star[1]) + 1.0);
      }
      
      self.drawIsland();

      matStack.push(matrix);
      opMatrix.load.rotate(self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      opMatrix.load.translate(0, -450, 0);
      matrix.multiply(opMatrix);
      opMatrix.load.rotate(-self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      self.drawSun();
      matStack.pop(matrix);

      matStack.push(matrix);
      opMatrix.load.rotate(self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      opMatrix.load.translate(0, 450, 0);
      matrix.multiply(opMatrix);
      opMatrix.load.rotate(-self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);

      let phase = self.moonPhase();
      if(phase < .25) {
        self.drawArc(skyColor, 20, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(colors.moon, 20, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((.25-phase)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(skyColor, 20, 0, Math.PI*2);
      } else if(phase < .5) {
        self.drawArc(skyColor, 20, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(colors.moon, 20, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((phase-.25)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(colors.moon, 20, 0, Math.PI*2);
      } else if(phase < .75) {
        phase-= .5;
        self.drawArc(colors.moon, 20, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(skyColor, 20, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((.75-phase-.5)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(colors.moon, 20, 0, Math.PI*2);        
      } else {
        self.drawArc(colors.moon, 20, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(skyColor, 20, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((phase-.75)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(skyColor, 20, 0, Math.PI*2);
      }
      matStack.pop(matrix);
      
      matStack.pop(matrix);
    },
    drawIsland() {
      shapes.drawColoredRect(colors.dirt, -200, -50, 200, 10);
      shapes.drawColoredTriangle(colors.grass, -200, -50, -400, 10, -200, 10);
      shapes.drawColoredTriangle(colors.dirt, -200, -40, -400, 20, -200, 20);
      shapes.drawColoredTriangle(colors.grass, 200, -50, 400, 10, 200, 10);
      shapes.drawColoredTriangle(colors.dirt, 200, -40, 400, 20, 200, 20);
      shapes.drawColoredRect(colors.grass, -200, -50, 200, -40);
    },
    drawSun() {
      matStack.push(matrix);
      let segments = 3;
      for(let i = 0; i < segments; i++) {
        shapes.drawColoredRect(colors.sun, -30, -30, 30, 30);
        opMatrix.load.rotate(Math.PI/(2*segments));
        matrix.multiply(opMatrix);
      }
      matStack.pop(matrix);
    },
    drawArc(color, rad, beg, end) {
      matStack.push(matrix);
      let segments = 40.0;
      let x = rad*Math.cos(beg);
      let y = rad*Math.sin(beg);
      for(let angle = beg; angle <= end; angle+= Math.PI/20.0) {
        if(angle > end) {
          angle = end;
        }
        let x2 = rad*Math.cos(angle);
        let y2 = rad*Math.sin(angle);
        shapes.drawColoredTriangle(color, x, y, 0, 0, x2, y2);
        x = x2;
        y = y2;
      }
      matStack.pop(matrix);
    },
    reflect(y, matrix) {
      opMatrix.load.translate(0, y*2, 0); matrix.multiply(opMatrix);
      opMatrix.load.scale(1, -1, 1); matrix.multiply(opMatrix);
    },
    tick(delta) {
      matStack.reset();
      matrix.load.identity();

      shapes.useMatrix(matrix);
      shapes.useMaterial(shapesMaterial);

      fb.bind();
      self.drawScene();
      shapes.flush();
      fb.unbind();
      
      opMatrix.load.translate(0, -render.height()/2, 0);
      matrix.multiply(opMatrix);
      self.drawScene();
      shapes.flush();

//      render.setStencil(true);
      render.drawStencil();
      matStack.push(matrix);
      opMatrix.load.translate(render.width()/2, render.height()/2, 0);
      matrix.multiply(opMatrix);
      shapes.drawColoredRect(Colors.WHITE, -render.width(), 75, render.width(), render.height());
      shapes.flush();
      render.drawColor();
      
      postMatrix.load.from(render.pixelMatrix);
      opMatrix.load.translate(0, render.height() + render.height()/2, 0);
      postMatrix.multiply(opMatrix);
      opMatrix.load.scale(1, -1, 1);
      postMatrix.multiply(opMatrix);
      
      post.drawQuad(fb.getAttributes());
      post.flush();
      render.setStencil(false);
      
      transition.draw(delta);
      time+= delta;
    }
  };
  return self;
};
