import {AssetManager} from "../assetmgr.js";
import {Colors, Color} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {Keyboard} from "../keyboard.js";

let colors = {
  bg: Color(0.02, 0.02, 0.02, 1)
};

export let AboutState = (game, menu, transition) => {
  let render = game.render;
  let sfx = game.sound;
  
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();
  let opMatrix = Mat4.create();

  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));

  let kb = Keyboard.create();
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
      font.draw(Colors.WHITE, 0, font.height*0, "Hey, I'm misson20000!");
      font.draw(Colors.WHITE, 0, font.height*1, "This is my custom engine I'll be using for Ludum Dare 36.");
      font.draw(Colors.WHITE, 0, font.height*2, "The Tools:");
      font.draw(Colors.WHITE, 0, font.height*3, "- Text Editor: emacs");
      font.draw(Colors.WHITE, 0, font.height*4, "- Language: EcmaScript 6 (emacs script :D)");
      font.draw(Colors.WHITE, 0, font.height*5, "- Transpiler: Babel");
      font.draw(Colors.WHITE, 0, font.height*6, "- Umm... webpacker: webpack");
      font.draw(Colors.WHITE, 0, font.height*7, "- Music: LMMS");
      font.draw(Colors.WHITE, 0, font.height*8, "- Images: GIMP");
      font.draw(Colors.WHITE, 0, font.height*9, "- Browser: Mozilla Firefox Developer Edition");
      font.draw(Colors.WHITE, 0, font.height*10, "- Linux Distro: Arch Linux");
      font.flush();

      transition.draw(delta);
    },
    getKeyboard() {
      return kb;
    }
  };
  return self;
}
