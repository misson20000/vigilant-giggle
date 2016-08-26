import {AssetManager} from "../../assetmgr.js";
import {Colors, Color, ColorUtils} from "../../gfxutils.js";
import {Mat4, Mat4Stack} from "../../math.js";
import {Keyboard} from "../../keyboard.js";

let colors = {
  bg: Color(0.02, 0.02, 0.02, 1),
  fg: Color(0.8, 0.8, 1, 1),
  water: ColorUtils.multRGB(Color(0.8, 0.8, 1, 1), 0.2),
  stars: ColorUtils.multRGB(Color(1, 0.8, 0.8, 1), 0.2)
};

export let StencilTestState = (game, menu, transition) => {
  let render = game.render;
  let shapesMaterial = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  let shapes = render.createShapeDrawer();

  let opMatrix = Mat4.create();
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();

  let kb = Keyboard.create();
  kb.createKeybind("Escape").addPressCallback(() => {
    transition.to(menu, 750, 500);
  });

  let stars = [];
  for(let i = 0; i < 1000; i++) {
    stars.push([Math.random(), Math.random()]);
  }
  
  let self = {
    initialize() {
    },

    drawScene() {
      for(let i = 0; i < stars.length; i++) {
        let star = stars[i];
        shapes.drawColoredRect(colors.stars,
                               (render.width() * star[0]) - 1.0,
                               (render.height() * star[1]) - 1.0,
                               (render.width() * star[0]) + 1.0,
                               (render.height() * star[1]) + 1.0);
      }

      shapes.drawColoredRect(colors.fg, 0, render.height()/2, render.width()/2 - 100, render.height());
      shapes.drawColoredRect(colors.fg, render.width()/2 + 100, render.height()/2, render.width(), render.height());
      shapes.drawColoredRect(colors.fg, game.mouse.x - 5, game.mouse.y - 5, game.mouse.x + 5, game.mouse.y + 5);
    },

    reflect(y) {
      opMatrix.load.translate(0, y*2, 0); matrix.multiply(opMatrix);
      opMatrix.load.scale(1, -1, 1); matrix.multiply(opMatrix);
    },
    
    tick(delta) {
      render.clear(colors.bg);
      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      shapes.useMatrix(matrix);
      shapes.useMaterial(shapesMaterial);

      self.drawScene();
      shapes.flush();

      render.setStencil(true);
      render.drawStencil();
      shapes.drawColoredRect(Colors.WHITE, 0, render.height()/2 + 100, render.width(), render.height()); // really doesn't matter what color, cause we can't see this
      shapes.flush();
      render.drawColor();
      
      self.reflect(render.height()/2 + 100);
      shapes.drawColoredRect(colors.bg, 0, 0, render.width(), render.height()); //clear
      self.drawScene();
      shapes.flush();
      render.setStencil(false);

      matStack.pop(matrix);
      font.useMatrix(matrix);
      font.draw(Colors.WHITE, 0, render.height()-font.height, "Press Escape to go back");
      font.flush();
      
      transition.draw(delta);
    },
    getKeyboard() {
      return kb;
    }
  };
  return self;
};
