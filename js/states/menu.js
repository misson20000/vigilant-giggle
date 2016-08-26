import {AssetManager} from "../assetmgr.js";
import {Colors, Color} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {Keyboard} from "../keyboard.js";

import {KeyboardTestState} from "./test/keyboard.js";
import {SoundTestState} from "./test/sound.js";
import {MusicTestState} from "./test/music.js";
import {StencilTestState} from "./test/stencil.js";
import {PostProcessingTestState} from "./test/post.js";
import {PostProcessingTest2State} from "./test/post2.js";
import {AboutState} from "./about.js";

export let MenuState = (game, transition) => {
  let render = game.render;
  let color = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  let rects = render.createShapeDrawer();
  let opMatrix = Mat4.create();
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();
  let time = 0;
  let unifTimer = 0;
  
  let gridA = Color(0.020, 0.020, 0.020, 1);
  let gridB = Color(0.030, 0.030, 0.030, 1);

  let shake = 0;
  let tests;
  let selectedTest = 0;

  let kb = Keyboard.create();
  let up = kb.createKeybind("ArrowUp", "w");
  let down = kb.createKeybind("ArrowDown", "s");
  let select = kb.createKeybind("Enter", "z", "Return");

  let selected = false;
  
  let self = {
    initialize() {
      selected = false;
      tests = [
        {
          name: "Me & My Tools",
          state: AboutState(game, self, transition),
          anim: 0
        },
        {
          name: "Keyboard Test",
          state: KeyboardTestState(game, self, transition),
          anim: 0
        },
        {
          name: "Sound Test",
          state: SoundTestState(game, self, transition),
          anim: 0
        },
        {
          name: "Music Test",
          state: MusicTestState(game, self, transition),
          anim: 0
        },
        {
          name: "Stencil Test",
          state: StencilTestState(game, self, transition),
          anim: 0
        },
        {
          name: "Post-Processing Test",
          state: PostProcessingTestState(game, self, transition),
          anim: 0
        },
        {
          name: "Post-Processing Test 2",
          state: PostProcessingTest2State(game, self, transition),
          anim: 0
        }
      ];

    },
    
    uniformTick() {
      shake = shake * 0.95;

      for(let i = 0; i < tests.length; i++) {
        if(i != selectedTest) {
          tests[i].anim *= 0.90;
        }
      }
    },
    
    tick(delta) {
      render.clear(Colors.BLACK);

      if(down.justPressed()) {
        selectedTest++;
        if(selectedTest >= tests.length) {
          selectedTest = 0;
        }
      }

      if(up.justPressed()) {
        selectedTest--;
        if(selectedTest < 0) {
          selectedTest = tests.length-1;
        }
      }

      if(select.justPressed()) {
        if(selected === false) {
          selected = selectedTest;
          transition.to(tests[selected].state, 750, 500);
        }
      }
      
      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      opMatrix.load.translate((Math.random()*2 - 1) * shake,
                              (Math.random()*2 - 1) * shake, 0);
      matrix.multiply(opMatrix);
      matStack.push(matrix);
      
      rects.useMatrix(matrix);
      rects.useMaterial(color);
      for(let x = 0; x < render.width(); x+= 20) {
        for(let y = 0; y < render.height(); y+= 20) {
          rects.drawColoredRect((x + y) % 40 == 0 ? gridA : gridB, x, y, x+20, y+20);
        }
      }
      rects.flush();

      matStack.peek(matrix);
      opMatrix.load.translate(render.width()/2, render.height()/2, 0);
      matrix.multiply(opMatrix);
      matStack.push(matrix);

      opMatrix.load.translate(0, -150, 0);
      matrix.multiply(opMatrix);
      
      opMatrix.load.rotate(Math.sin(time / 150.0) / 6);
      matrix.multiply(opMatrix);
      
      font.useMatrix(matrix);
      font.drawCentered(Colors.WHITE, 0, -font.height/2, "LD36 Engine Test");
      font.flush();

      matStack.pop(matrix);
      
      for(let i = 0; i < tests.length; i++) {
        let test = tests[i];
        if(i == selectedTest) {
          test.anim = 1;
        }
        matStack.push(matrix);
        opMatrix.load.scale(((Math.sin(time / 150.0) + 4) / 10) * test.anim + 1,
                            ((Math.sin(time / 150.0) + 4) / 10) * test.anim + 1,
                            ((Math.sin(time / 150.0) + 4) / 10) * test.anim + 1);
        matrix.multiply(opMatrix);
        
        font.drawCentered(Colors.WHITE, 0, -font.height/2, tests[i].name);

        matStack.pop(matrix);

        opMatrix.load.translate(0, font.height, 0);
        matrix.multiply(opMatrix);
      }
      
      transition.draw(delta);
      time+= delta;
      unifTimer+= delta;
      while(unifTimer > 10) {
        unifTimer-= 10;
        self.uniformTick();
      }
    },

    getKeyboard() {
      return kb;
    }
  };
  return self;
};
