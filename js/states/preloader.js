import {AssetManager} from "../assetmgr.js";
import {Colors} from "../gfxutils.js";

import {LoaderState} from "./loader.js";

export let PreloaderState = (game) => {
  let render = game.render;

  let time = 0;
  let uniformTickTimer = 0;

  let promise;
  
  return {
    initialize() {
      promise = AssetManager.downloadAssetGroup("base");
      promise.then(() => {
        game.switchState(LoaderState(game));
      }, (err) => {
        console.log("failed to load assets: " + err);
      });
    },
    
    uniformTick() { // 200hz
    },
    
    tick(delta) { // variable framerate
      time+= delta;
      uniformTickTimer+= delta;

      if(uniformTickTimer > 5) {
        uniformTickTimer-= 5;
        this.uniformTick();
      }
      
      render.clear(Colors.BLACK);
    }
  };
};
