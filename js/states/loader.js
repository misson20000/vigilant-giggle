import {AssetManager} from "../assetmgr.js";
import {Colors, Color} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {DiamondTransition} from "../transitions.js";
import {PlayState} from "./play.js";

export let LoaderState = (game) => {
  let render = game.render;
  let color = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"),
                                       render.pixelMatrix);
  let smallfont = render.createFontRenderer(AssetManager.getAsset("base.font.coders_crux"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"),
                                       render.pixelMatrix);
  let rects = render.createShapeDrawer();
  let opMatrix = Mat4.create();
  let matrix = Mat4.create();
  let matStack = Mat4Stack.create();
  
  let time = 0;

  let backgroundColor = Color("#422D24");
  let foregroundColor = Color("#241711");

  let transition = DiamondTransition(game, "left");

  let error;
  let errored = false;
  
  return {
    initialize() {
      AssetManager.downloadAssetGroup("game").then(() => {
        transition.to(PlayState(game, transition), 500, 100);
      }, (err) => {
        console.log("failed to load assets: " + err);
        errored = true;
        error = err;
      });
    },

    tick(delta) {
      render.clear(backgroundColor);

      matStack.reset();
      matrix.load.identity();
      matStack.push(matrix);

      //rects.useMatrix(matrix);
      //rects.useMaterial(color);
      //rects.flush();

      opMatrix.load.translate(render.width()/2, render.height()/2, 0);
      matrix.multiply(opMatrix);
      
      opMatrix.load.translate(render.width()%2 / 2, render.height()%2 / 2, 0); //pixel aign
      matrix.multiply(opMatrix);
      
      font.useMatrix(matrix);
      smallfont.useMatrix(matrix);
      if(!errored) {
        font.drawCentered(foregroundColor, 0, -318, "Downloading Resources...");
      } else {
        font.drawCentered(foregroundColor, 0, -318, "Error While Downloading Assets:");
        smallfont.drawCentered(foregroundColor, 0, -316+font.height, error);
        smallfont.flush();
      }
      font.flush();

      transition.draw(delta);
    }
  };
};
