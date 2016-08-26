import {AssetManager} from "../../assetmgr.js";
import {Colors, Color} from "../../gfxutils.js";
import {Mat4, Mat4Stack} from "../../math.js";
import {Keyboard} from "../../keyboard.js";

let colors = {
  bg: Color(0.02, 0.02, 0.02, 1),
  arrowOutline: Color(0.8, 0.8, 1, 1),
  pressed: Color(1, 1, 1, 1),
  debug: Colors.RED
};

export let KeyboardTestState = (game, menu, transition) => {
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
  let time = 0;
  let unifTimer = 0;
  let shake = 0;
  let kb = Keyboard.create();

  let binds = [
    kb.createKeybind("ArrowLeft", "a"),
    kb.createKeybind("ArrowUp", "w"),
    kb.createKeybind("ArrowDown", "s"),
    kb.createKeybind("ArrowRight", "d")
  ];

  kb.createKeybind("Escape").addPressCallback(() => {
    transition.to(menu, 750, 500);
  });
  
  for(let i = 0; i < binds.length; i++) {
    binds[i].addPressCallback(() => {
      shake = 10;
    });
  }
  
  let self = {
    drawLeftArrow(hollow) {
      matStack.push(matrix);
      opMatrix.load.rotate(-Math.PI/2);
      matrix.multiply(opMatrix);
      self.drawUpArrow(hollow);
      matStack.pop(matrix);
    },

    drawUpArrow(hollow) {
      shapes.drawColoredRect(colors.arrowOutline, -10, -10, 10, 20);
      shapes.drawColoredTriangle(colors.arrowOutline, -20, 0, 0, -20, 20, 0);

      if(hollow) {
        shapes.drawColoredRect(hollow, -8, -2, 8, 18);
        shapes.drawColoredTriangle(hollow, -16, -2, 0, -16, 16, -2);
      }
    },

    drawDownArrow(hollow) {
      matStack.push(matrix);
      opMatrix.load.rotate(Math.PI);
      matrix.multiply(opMatrix);
      self.drawUpArrow(hollow);
      matStack.pop(matrix);
    },

    drawRightArrow(hollow) {
      matStack.push(matrix);
      opMatrix.load.rotate(Math.PI/2);
      matrix.multiply(opMatrix);
      self.drawUpArrow(hollow);
      matStack.pop(matrix);
    },

    uniformTick() {
      shake*= 0.95;
    },
    
    tick(delta) {
      render.clear(colors.bg);

      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      shapes.useMatrix(matrix);
      shapes.useMaterial(shapesMaterial);
      
      opMatrix.load.translate(render.width()/2, render.height()/2, 0);
      matrix.multiply(opMatrix);
      matStack.push(matrix);

      opMatrix.load.translate((Math.random() * 2 - 1) * shake,
                              (Math.random() * 2 - 1) * shake, 0);
      matrix.multiply(opMatrix);
      matStack.push(matrix);
      
      opMatrix.load.translate(-75, 0, 0);
      matrix.multiply(opMatrix);

      let symbols = [self.drawLeftArrow, self.drawUpArrow, self.drawDownArrow, self.drawRightArrow];
      for(let i = 0; i < symbols.length; i++) {
        symbols[i](binds[i].isPressed() ? colors.pressed : colors.bg);
        
        opMatrix.load.translate(50, 0, 0);
        matrix.multiply(opMatrix);
      }

      unifTimer+= delta;
      while(unifTimer > 10) {
        unifTimer-= 10;
        self.uniformTick();
      }
      
      shapes.flush();

      matrix.load.identity();
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
