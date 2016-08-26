import {AssetManager} from "../../assetmgr.js";
import {Colors, Color} from "../../gfxutils.js";
import {Mat4, Mat4Stack} from "../../math.js";
import {Keyboard} from "../../keyboard.js";

let colors = {
  bg: Color(0.02, 0.02, 0.02, 1),
  point: Color(0.8, 0.8, 1, 1)
};

export let MusicTestState = (game, menu, transition) => {
  let render = game.render;
  let sfx = game.sound;
  
  let color = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let shapes = render.createShapeDrawer();
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.coders_crux"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  let bigfont = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                          AssetManager.getAsset("base.shader.flat.texcolor"));
  
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();
  let opMatrix = Mat4.create();

  let points = {
    harmony: [50, 50],
    bass: [600, 60],
    ride: [300, 300],
    beat: [50, 600],
    melody: [600, 600],
    arpeggio: [300, 50]
  };

  let music;

  let kb = Keyboard.create();
  kb.createKeybind("Escape").addPressCallback(() => {
    transition.to(menu, 750, 500);
  });

  let self = {
    initialize() {
      music = sfx.playMusic(AssetManager.getAsset("mustest.music"));
    },
    tick(delta) {
      render.clear(colors.bg);

      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      font.useMatrix(matrix);
      shapes.useMatrix(matrix);
      shapes.useMaterial(color);
      for(let name in points) {
        let pt = points[name];

        shapes.drawColoredRect(colors.point, pt[0] - 5, pt[1] - 5, pt[0] + 5, pt[1] + 5);
        font.draw(colors.point, pt[0] + 7, pt[1] - font.height - 7, name);

        music.setTrackVolume(name, 1-Math.min(Math.max(Math.sqrt(Math.pow(game.mouse.x - pt[0], 2) + Math.pow(game.mouse.y - pt[1], 2)) / 700.0, 0), 1));
      }

      font.draw(colors.point, 0, 0, "(" + game.mouse.x + ", " + game.mouse.y + ")");
      
      shapes.flush();
      font.flush();

      bigfont.useMatrix(matrix);
      bigfont.draw(Colors.WHITE, 0, render.height()-bigfont.height, "Press Escape to go back");
      bigfont.flush();
      
      music.update();

      transition.draw(delta);
    },
    destroy() {
      music.stop();
    },
    getKeyboard() {
      return kb;
    }
  };

  return self;
};
