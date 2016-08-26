import {AssetManager} from "../../assetmgr.js";
import {Colors, Color} from "../../gfxutils.js";
import {Mat4, Mat4Stack} from "../../math.js";
import {Keyboard} from "../../keyboard.js";

let colors = {
  bg: Color(0.02, 0.02, 0.02, 1)
};

export let SoundTestState = (game, menu, transition) => {
  let render = game.render;
  let sfx = game.sound;
  
  let soundMap = {
    "a": "sfxtest.krab",
    "s": "sfxtest.krabs",
    "d": "sfxtest.mr",
    "f": "sfxtest.oh",
    "g": "sfxtest.yeah"
  };

  let kb = Keyboard.create();
  
  for(let key in soundMap) {
    let asset = AssetManager.getAsset(soundMap[key]);
    
    kb.createKeybind(key).addPressCallback(() => {
      sfx.playSound(asset);
    });
  }
  
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();
  let opMatrix = Mat4.create();

  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  
  kb.createKeybind("Escape").addPressCallback(() => {
    transition.to(menu, 750, 500);
  });
  
  let self = {
    initialize() {
    },
    tick(delta) {
      render.clear(colors.bg);

      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      font.useMatrix(matrix);
      font.draw(Colors.WHITE, 0, render.height()-font.height, "Press Escape to go back");
      font.draw(Colors.WHITE, 0, 0, "Try ASDFG. Be careful, though, because it's loud!");
      font.flush();

      transition.draw(delta);
    },
    getKeyboard() {
      return kb;
    }
  };

  return self;
};
