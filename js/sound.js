import * as BlobUtil from "blob-util";

import {AssetManager} from "./assetmgr.js";

export let SoundEngine = (game) => {
  let ctx = new AudioContext();

  let sfx = {
    createAssetLoader() {
      let loaders = {
        "sound": (placeholder) => {
          return AssetManager.getFile(placeholder.spec.src).then((blob) => {
            return BlobUtil.blobToArrayBuffer(blob);
          }).then((ab) => {
            return ctx.decodeAudioData(ab);
          }).then((audio) => {
            return audio;
          });
        },
        "music": (placeholder) => {
          let tracks = {};
          let promises = [];
          for(let name in placeholder.spec.tracks) {
            let track = placeholder.spec.tracks[name];
            tracks[name] = [];
            for(let i = 0; i < track.length; i++) {
              let media = new Audio();
              media.loop = true;
              tracks[name].push(media);
              promises.push(new Promise((resolve, reject) => { //pre-buffer enough of the track
                media.oncanplaythrough = resolve;
                media.onerror = () => {
                  reject(["!?!?!",
                          "MEDIA_ERR_ABORTED",
                          "MEDIA_ERR_NETWORK",
                          "MEDIA_ERR_DECODE",
                          "MEDIA_ERR_SRC_NOT_SUPPORTED"][media.error.code] + " on track '" + name + "', source " + i + " (" + track[i] + " -> " + AssetManager.getURL(track[i]) + ")");
                };
                media.src = AssetManager.getURL(track[i]);
              }));
            }
          }

          return Promise.all(promises).then(() => {
            return tracks;
          });
        }
      };
      
      return {
        canLoad(placeholder) {
          return loaders[placeholder.spec.type] != undefined;
        },
        load(placeholder) {
          return loaders[placeholder.spec.type](placeholder);
        }
      };
    },
    playSound(buffer) {
      let source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    },
    playMusic(asset) {
      let tracks = {};
      for(let track in asset) {
        let gain = ctx.createGain();
        for(let i = 0; i < asset[track].length; i++) {
          let src = ctx.createMediaElementSource(asset[track][i]);
          src.connect(gain);
          asset[track][i].play();
        }
        gain.gain.value = 1;
        gain.connect(ctx.destination);
        tracks[track] = gain;
      }
      
      let music = {
        update() {
        },
        setTrackVolume(name, gain) {
          tracks[name].gain.value = gain;
        }
      };
      return music;
    }
  };

  return sfx;
};
