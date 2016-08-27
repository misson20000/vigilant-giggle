import {AssetManager} from "./assetmgr.js";
import {Colors} from "./gfxutils.js";

export let DiamondTransition = (game, dir) => {
  let render = game.render;

  let time = 0;
  let target = 0;
  let state;
  let pause;

  let material = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelCenteredMatrix
  });

  let switched = false;
  
  let self = {
    to(state2, duration, pause2) {
      time = 0;
      target = duration;
      state = state2;
      pause = pause2;
      switched = false;
    },
    draw(delta) {
      if(target <= 0) {
        return;
      }
      time+= delta;
      if(time > target && !switched) {
        switched = true;
        game.switchState(state);
      }

      let progress = time / target;

      if(progress < 2) {
        let params = [];
        let color = Colors.BLACK;
        
        let size = 20;
        
        let dir = progress < 1 ? 1 : -1;
        
        let pg = progress;
        
        if(progress > 1) {
          if(pause > 0) {
            pause-= delta;
            time-= delta;
            progress = 1;
          }
          pg = 1 - (progress - 1);
        }
        
        for(let x = -render.width()/2; x <= render.width()/2 + size; x+= size*2) {
          for(let y = -render.height()/2; y <= render.height()/2 + size; y+= size*2) {
            let i = 0;
            let sz = size * ((pg * 3) - dir*(x/render.width()) - 0.5);

            if(sz > 0) {
              params[i++] = color;
              
              params[i++] = x - sz;
              params[i++] = y;
              params[i++] = 1;
              
              params[i++] = x;
              params[i++] = y - sz;
              params[i++] = 1;
              
              params[i++] = x;
              params[i++] = y + sz;
              params[i++] = 1;
              
              params[i++] = x + sz;
              params[i++] = y;
              params[i++] = 1;
              material.drawQuad(params);
            }
          }
        }

        material.flush();
      }
    }
  };
  return self;
};
