export let Keyboard = {
  create() {
    let bindMap = {};
    let bindings = [];
    
    let self = {
      createKeybind() {
        let lastState = false;
        let state = false;

        let pressCBs = [];
        let releaseCBs = [];
        
        let bind = {
          press() {
            state = true;
          },
          release() {
            state = false;
          },
          justPressed() {
            return state && !lastState;
          },
          justReleased() {
            return !state && lastState;
          },
          isPressed() {
            return state;
          },
          update() {
            if(bind.justPressed()) {
              for(let i = 0; i < pressCBs.length; i++) {
                pressCBs[i]();
              }
            }
            if(bind.justReleased()) {
              for(let i = 0; i < releaseCBs.length; i++) {
                releaseCBs[i]();
              }
            }
            
            lastState = state;
          },
          addPressCallback(cb) {
            pressCBs.push(cb);
          },
          addReleaseCallback(cb) {
            releaseCBs.push(cb);
          }
        };

        for(let i = 0; i < arguments.length; i++) {
          if(!bindMap[arguments[i]]) {
            bindMap[arguments[i]] = [];
          }
          bindMap[arguments[i]].push(bind);
        }

        bindings.push(bind);
        
        return bind;
      },

      update() {
        for(let i = 0; i < bindings.length; i++) {
          bindings[i].update();
        }
      },
      
      keyDown(evt) {
        if(bindMap[evt.key]) {
          for(let i = 0; i < bindMap[evt.key].length; i++) {
            bindMap[evt.key][i].press();
          }
        }
      },
      keyUp(evt) {
        if(bindMap[evt.key]) {
          for(let i = 0; i < bindMap[evt.key].length; i++) {
            bindMap[evt.key][i].release();
          }
        }
      }
    };
    
    return self;
  }
};
