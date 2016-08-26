import {WebGLRenderer} from "./webgl.js";
import {PreloaderState} from "./states/preloader.js";
import {AssetManager} from "./assetmgr.js";
import {SoundEngine} from "./sound.js";

let game = {};
window.theGame = game;

window.onload = () => {
  let canvas = document.getElementById("gamecanvas");
  game.render = WebGLRenderer(game, canvas, canvas.getContext("webgl", {
    alpha: false
  }));
  game.sound = SoundEngine(game);
  game.mouse = {x: 0, y: 0};
  
  game.switchState = (newstate) => {
    if(game.state && game.state.destroy) {
      game.state.destroy();
    }
    game.state = newstate;
    if(newstate.initialize) {
      newstate.initialize();
    }
  };
  
  game.switchState(PreloaderState(game));

  AssetManager.addAssetLoader(game.render.createAssetLoader());
  AssetManager.addAssetLoader(game.sound.createAssetLoader());
  
  let lastTick = performance.now();
  game.tick = (timestamp) => {
    let delta = timestamp - lastTick;
    lastTick = timestamp;

    game.render.manageSize();
    game.render.initMatrices();
    
    if(game.state && game.state.tick) {
      game.state.tick(delta);
    }

    if(game.state && game.state.getKeyboard) {
      game.state.getKeyboard().update();
    }
    
    window.requestAnimationFrame(game.tick);
  };
  window.requestAnimationFrame(game.tick);

  document.addEventListener("keydown", (evt) => {
    if(game.state && game.state.getKeyboard) {
      game.state.getKeyboard().keyDown(evt);
    }
  });

  document.addEventListener("keyup", (evt) => {
    if(game.state && game.state.getKeyboard) {
      game.state.getKeyboard().keyUp(evt);
    }
  });

  document.addEventListener("mousemove", (evt) => {
    game.mouse.x = evt.clientX;
    game.mouse.y = evt.clientY;
  });
};
