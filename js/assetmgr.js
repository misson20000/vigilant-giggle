import * as BlobUtil from "blob-util";

let fileProviders = [];
let assetLoaders = [];
let assets = {};
let placeholders = {};

let AssetPlaceholder = (spec) => {
  let self = {spec, id: spec.id};

  let state = {};

  self.state = "unbound";
  
  self.promise = new Promise((resolve, reject) => {
    state.resolve = resolve;
    state.reject = reject;
  });

  self.promise.then((value) => {
    self.state = "loaded";
    self.value = value;
  }, (err) => {
    self.state = "error";
    self.error = err;
  });
  
  self.bind = (promise) => {
    self.state = "loading";
    promise.then(state.resolve, state.reject);
    return self.promise;
  };

  self.dependencies = [];
  self.dependants = [];
  
  self.depend = (id) => {
    let ph = AssetManager.getPlaceholder(id);
    if(!ph) {
      throw "No such asset '" + id + "' has been discovered";
    }
    let verifyDepTree = (node) => {
      if(node.id == self.id) {
        return [self.id];
      }
      
      for(let i = 0; i < node.dependencies.length; i++) {
        let loop = verifyDepTree(i);
        if(loop) {
          return loop.push(node.id);
        }
      }
    };
    let loop = verifyDepTree(ph);
    if(!loop) {
      self.dependencies.push(ph);
      ph.dependants.push(self);
      return ph.promise;
    } else {
      throw "Dependency loop: " + loop.join(" -> ");
    }
  };
  
  return self;
};

export let AssetManager = {
  GroupDownloadState: {
    DISCOVERING: {
      description: "Discovering assets"
    },
    DOWNLOADING: {
      description: "Downloading assets"
    }
  },

  getFile(file) {
    let attempt = (i) => {
      let provider = fileProviders[i];
      return provider.getFile(file).catch((error) => {
        if(i < fileProviders.length - 1) {
          return attempt(i+1);
        } else {
          throw error;
        }
      });
    };
    return attempt(0);
  },
  getURL(file) {
    let attempt = (i) => {
      try {
        return fileProviders[i].getURL(file);
      } catch(error) {
        if(i < fileProviders.length - 1) {
          return attempt(i+1);
        } else {
          throw error;
        }
      }
    };
    return attempt(0);
  },

  getPlaceholder(id) {
        if(!placeholders[id]) {
      throw "No such asset '" + id + "' has been discovered";
    }
    return placeholders[id];
  },

  getAsset(id) {
    if(!placeholders[id]) {
      throw "No such asset '" + id + "' has been discovered";
    }
    if(!placeholders[id].value) {
      throw "Asset '" + id + "' has not yet been loaded";
    }
    return placeholders[id].value;
  },

  downloadAssetGroup(name) {
    let promise = this.getFile(name + ".asgroup").then((blob) => {
      return BlobUtil.blobToBinaryString(blob)
    }, (err) => {
      throw err + " while discovering assets in group " + name;
    }).then((string) => {
      return JSON.parse(string);
    }).then((json) => {
      let loadingQueue = [];
      for(let i = 0; i < json.length; i++) {
        let spec = json[i];
        loadingQueue.push(placeholders[spec.id] = AssetPlaceholder(spec));
      }

      let promises = [];
      for(let i = 0; i < loadingQueue.length; i++) {
        let placeholder = loadingQueue[i];

        let foundLoader = false;
        for(let j = 0; j < assetLoaders.length; j++) {
          if(assetLoaders[j].canLoad(placeholder)) {
            foundLoader = true;
            promises.push(placeholder.bind(assetLoaders[j].load(placeholder)).catch((err) => {
              throw err + " while loading " + placeholder.spec.id;
            }));
            break;
          }
        }

        if(!foundLoader) {
          throw "No loader found for spec " + JSON.stringify(placeholder.spec);
        }
      }

      return Promise.all(promises);
    });

    promise.dlState = this.GroupDownloadState.DISCOVERING;
    return promise;
  },
  addFileProvider(provider) {
    fileProviders.push(provider);
    fileProviders.sort((a, b) => {
      return Math.sign(b.priority - a.priority)
    });
  },
  addAssetLoader(loader) {
    assetLoaders.push(loader);
  },
};

AssetManager.addFileProvider({ // download over the network
  priority: -1000,
  getFile(name) {
    return fetch("assets/" + name.replace(" ", "%20")).then((response) => {
      if(!response.ok) {
        throw "HTTP " + response.status + " " + response.statusText + " while downloading assets/" + name.replace(" ", "%20");
      }
      return response.blob();
    });
  },
  getURL(file) {
    return "assets/" + file;
  }
});
