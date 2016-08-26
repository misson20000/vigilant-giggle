/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _webgl = __webpack_require__(1);
	
	var _preloader = __webpack_require__(9);
	
	var _assetmgr = __webpack_require__(7);
	
	var game = {};
	
	window.onload = function () {
	  var canvas = document.getElementById("gamecanvas");
	  game.render = (0, _webgl.WebGLRenderer)(game, canvas, canvas.getContext("webgl"));
	  game.switchState = function (newstate) {
	    if (game.state && game.state.destroy) {
	      game.state.destroy();
	    }
	    game.state = newstate;
	    if (newstate.initialize) {
	      newstate.initialize();
	    }
	  };
	
	  game.switchState((0, _preloader.PreloaderState)(game));
	
	  _assetmgr.AssetManager.addAssetLoader(game.render.createAssetLoader());
	
	  var lastTick = performance.now();
	  game.tick = function (timestamp) {
	    var delta = timestamp - lastTick;
	    lastTick = timestamp;
	
	    game.render.manageSize();
	
	    if (game.state && game.state.tick) {
	      game.state.tick(delta);
	    }
	
	    window.requestAnimationFrame(game.tick);
	  };
	  window.requestAnimationFrame(game.tick);
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.WebGLRenderer = undefined;
	
	var _blobUtil = __webpack_require__(2);
	
	var BlobUtil = _interopRequireWildcard(_blobUtil);
	
	var _assetmgr = __webpack_require__(7);
	
	var _math = __webpack_require__(8);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var WebGLRenderer = exports.WebGLRenderer = function WebGLRenderer(game, canvas, gl) {
	  return {
	    manageSize: function manageSize() {
	      if (canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
	        canvas.width = window.innerWidth;
	        canvas.height = window.innerHeight;
	
	        gl.viewport(0, 0, canvas.width, canvas.height);
	
	        if (game.state && game.state.updateSize) {
	          game.state.updateSize(canvas.width, canvas.height);
	        }
	      }
	    },
	    clear: function clear(color) {
	      gl.clearColor(color.r, color.g, color.b, color.a);
	      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	    },
	    width: function width() {
	      return canvas.width;
	    },
	    height: function height() {
	      return canvas.height;
	    },
	    createAssetLoader: function createAssetLoader() {
	      var loaders = {
	        "shader": function shader(placeholder) {
	          if (placeholder.spec.shadertype == "fragment" || placeholder.spec.shadertype == "vertex") {
	            return _assetmgr.AssetManager.getFile(placeholder.spec.src).then(function (blob) {
	              return BlobUtil.blobToBinaryString(blob);
	            }).then(function (src) {
	              var shader = gl.createShader({ fragment: gl.FRAGMENT_SHADER, vertex: gl.VERTEX_SHADER }[placeholder.spec.shadertype]);
	              gl.shaderSource(shader, src);
	              gl.compileShader(shader);
	              if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	                var log = gl.getShaderInfoLog(shader);
	                gl.deleteShader(shader);
	                throw "Could not compile shader: " + log;
	              }
	
	              return shader;
	            });
	          }
	          if (placeholder.spec.shadertype == "program") {
	            var promises = placeholder.spec.shaders.map(function (id) {
	              return placeholder.depend(id);
	            });
	            return Promise.all(promises).then(function (shaders) {
	              var program = gl.createProgram();
	              for (var i = 0; i < shaders.length; i++) {
	                gl.attachShader(program, shaders[i]);
	              }
	              gl.linkProgram(program);
	
	              if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	                throw "Could not link program: " + gl.getProgramInfoLog(program);
	              }
	
	              var runtime = {
	                stride: 0,
	                numComponents: 0
	              };
	
	              var attribOffset = 0;
	              var attributes = placeholder.spec.attributes.map(function (attrib) {
	                var loc = gl.getAttribLocation(program, attrib.name);
	                if (loc == -1) {
	                  throw "Could not find attribute '" + attrib.name + "'";
	                }
	                runtime.stride += attrib.components * 4; // 4 bytes / float
	                runtime.numComponents += attrib.components;
	
	                attrib.location = loc;
	                attrib.runtime = {};
	                attrib.runtime.components = [];
	                attrib.runtime.offset = attribOffset;
	                attribOffset += attrib.components * 4; // 4 bytes / float
	                attrib.runtime.loadData = function (args, i) {
	                  switch (attrib.datatype) {
	                    case "color":
	                      var arg = args[i++];
	                      attrib.runtime.components[0] = arg.r;
	                      attrib.runtime.components[1] = arg.g;
	                      attrib.runtime.components[2] = arg.b;
	                      break;
	                    case "vec3":
	                      for (var j = 0; j < attrib.components; j++) {
	                        attrib.runtime.components[j] = args[i++];
	                      }
	                      break;
	                    default:
	                      throw "bad attribute data type '" + attrib.datatype + "'";
	                  }
	
	                  return i;
	                };
	
	                return attrib;
	              });
	
	              var uniforms = {};
	              for (var _i = 0; _i < placeholder.spec.uniforms.length; _i++) {
	                var uniform = placeholder.spec.uniforms[_i];
	                var loc = gl.getUniformLocation(program, uniform);
	                if (loc == -1) {
	                  throw "Could not find uniform '" + uniform + "'";
	                }
	
	                uniforms[uniform] = loc;
	              }
	
	              return {
	                program: program,
	                attributes: attributes,
	                uniforms: uniforms,
	                runtime: runtime
	              };
	            });
	          }
	          throw "bad shadertype: " + placeholder.spec.shadertype;
	        }
	      };
	
	      return {
	        canLoad: function canLoad(placeholder) {
	          return loaders[placeholder.spec.type] != undefined;
	        },
	        load: function load(placeholder) {
	          return loaders[placeholder.spec.type](placeholder);
	        }
	      };
	    },
	    createLayer: function createLayer(shader) {
	      var quads = 1024;
	
	      var vertBuffer = gl.createBuffer();
	      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	
	      var perVertex = [];
	      var perShape = [];
	      for (var i = 0; i < shader.attributes.length; i++) {
	        var attrib = shader.attributes[i];
	
	        switch (attrib.type) {
	          case "per-vertex":
	            perVertex.push(attrib);
	            break;
	          case "per-shape":
	            perShape.push(attrib);
	            break;
	          default:
	            throw "Bad attribute type '" + attrib.type + "' on " + attrib.name;
	        }
	      }
	
	      var buffer = new Float32Array(quads * 2 // 2 triangles per quad
	      * 3 // 3 vertices per triangle
	      * shader.runtime.numComponents);
	      var bp = 0; // buffer pos
	      var numTris = 0;
	
	      gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
	
	      var bufferFromAttributes = function bufferFromAttributes() {
	        for (var _i2 = 0; _i2 < shader.attributes.length; _i2++) {
	          var _attrib = shader.attributes[_i2];
	          for (var j = 0; j < _attrib.components; j++) {
	            buffer[bp++] = _attrib.runtime.components[j];
	          }
	        }
	      };
	
	      var self = {
	        matrix: _math.Mat4.create(),
	
	        createRectDrawer: function createRectDrawer() {
	          // trades flexibility for lack of allocations
	          var params = [];
	
	          var self2 = {
	            drawColoredRect: function drawColoredRect(color, x1, y1, x2, y2) {
	              var i = 0;
	              params[i++] = color;
	              params[i++] = x1;
	              params[i++] = y1;
	              params[i++] = 0;
	              params[i++] = x2;
	              params[i++] = y1;
	              params[i++] = 0;
	              params[i++] = x1;
	              params[i++] = y2;
	              params[i++] = 0;
	              params[i++] = x2;
	              params[i++] = y2;
	              params[i++] = 0;
	
	              self.drawQuad(params);
	            }
	          };
	          return self2;
	        },
	        drawQuad: function drawQuad(args) {
	          //let args = arguments;
	          var argI = 0;
	          for (var _i3 = 0; _i3 < perShape.length; _i3++) {
	            argI = perShape[_i3].runtime.loadData(args, argI);
	          }
	
	          for (var _i4 = 0; _i4 < perVertex.length; _i4++) {
	            argI = perVertex[_i4].runtime.loadData(args, argI);
	          }
	          bufferFromAttributes();
	          var tri2argI = argI;
	          for (var h = 0; h < 2; h++) {
	            for (var _i5 = 0; _i5 < perVertex.length; _i5++) {
	              argI = perVertex[_i5].runtime.loadData(args, argI);
	            }
	            bufferFromAttributes();
	          }
	          argI = tri2argI; //rewind argument iterator to where it was after the first vertex was read
	          for (var _h = 0; _h < 3; _h++) {
	            for (var _i6 = 0; _i6 < perVertex.length; _i6++) {
	              argI = perVertex[_i6].runtime.loadData(args, argI);
	            }
	            bufferFromAttributes();
	          }
	
	          numTris += 2;
	        },
	
	
	        flush: function flush() {
	          gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	          gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer);
	
	          gl.useProgram(shader.program);
	
	          for (var _i7 = 0; _i7 < shader.attributes.length; _i7++) {
	            var _attrib2 = shader.attributes[_i7];
	            gl.enableVertexAttribArray(_attrib2.location);
	            gl.vertexAttribPointer(_attrib2.location, _attrib2.components, gl.FLOAT, false, shader.runtime.stride, _attrib2.runtime.offset);
	          }
	
	          gl.uniformMatrix4fv(shader.uniforms.matrix, false, self.matrix.toGL());
	
	          gl.drawArrays(gl.TRIANGLES, 0, numTris * 3);
	
	          for (var _i8 = 0; _i8 < shader.attributes.length; _i8++) {
	            gl.disableVertexAttribArray(shader.attributes[_i8].location);
	          }
	
	          bp = 0;
	          numTris = 0;
	        }
	      };
	
	      return self;
	    }
	  };
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/* jshint -W079 */
	var Blob = __webpack_require__(3);
	var Promise = __webpack_require__(4);
	
	//
	// PRIVATE
	//
	
	// From http://stackoverflow.com/questions/14967647/ (continues on next line)
	// encode-decode-image-with-base64-breaks-image (2013-04-21)
	function binaryStringToArrayBuffer(binary) {
	  var length = binary.length;
	  var buf = new ArrayBuffer(length);
	  var arr = new Uint8Array(buf);
	  var i = -1;
	  while (++i < length) {
	    arr[i] = binary.charCodeAt(i);
	  }
	  return buf;
	}
	
	// Can't find original post, but this is close
	// http://stackoverflow.com/questions/6965107/ (continues on next line)
	// converting-between-strings-and-arraybuffers
	function arrayBufferToBinaryString(buffer) {
	  var binary = '';
	  var bytes = new Uint8Array(buffer);
	  var length = bytes.byteLength;
	  var i = -1;
	  while (++i < length) {
	    binary += String.fromCharCode(bytes[i]);
	  }
	  return binary;
	}
	
	// doesn't download the image more than once, because
	// browsers aren't dumb. uses the cache
	function loadImage(src, crossOrigin) {
	  return new Promise(function (resolve, reject) {
	    var img = new Image();
	    if (crossOrigin) {
	      img.crossOrigin = crossOrigin;
	    }
	    img.onload = function () {
	      resolve(img);
	    };
	    img.onerror = reject;
	    img.src = src;
	  });
	}
	
	function imgToCanvas(img) {
	  var canvas = document.createElement('canvas');
	
	  canvas.width = img.width;
	  canvas.height = img.height;
	
	  // copy the image contents to the canvas
	  var context = canvas.getContext('2d');
	  context.drawImage(
	    img,
	    0, 0,
	    img.width, img.height,
	    0, 0,
	    img.width, img.height);
	
	  return canvas;
	}
	
	//
	// PUBLIC
	//
	
	/**
	 * Shim for
	 * [new Blob()]{@link https://developer.mozilla.org/en-US/docs/Web/API/Blob.Blob}
	 * to support
	 * [older browsers that use the deprecated <code>BlobBuilder</code> API]{@link http://caniuse.com/blob}.
	 *
	 * @param {Array} parts - content of the <code>Blob</code>
	 * @param {Object} options - usually just <code>{type: myContentType}</code>
	 * @returns {Blob}
	 */
	function createBlob(parts, options) {
	  options = options || {};
	  if (typeof options === 'string') {
	    options = {type: options}; // do you a solid here
	  }
	  return new Blob(parts, options);
	}
	
	/**
	 * Shim for
	 * [URL.createObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.createObjectURL}
	 * to support browsers that only have the prefixed
	 * <code>webkitURL</code> (e.g. Android <4.4).
	 * @param {Blob} blob
	 * @returns {string} url
	 */
	function createObjectURL(blob) {
	  return (window.URL || window.webkitURL).createObjectURL(blob);
	}
	
	/**
	 * Shim for
	 * [URL.revokeObjectURL()]{@link https://developer.mozilla.org/en-US/docs/Web/API/URL.revokeObjectURL}
	 * to support browsers that only have the prefixed
	 * <code>webkitURL</code> (e.g. Android <4.4).
	 * @param {string} url
	 */
	function revokeObjectURL(url) {
	  return (window.URL || window.webkitURL).revokeObjectURL(url);
	}
	
	/**
	 * Convert a <code>Blob</code> to a binary string. Returns a Promise.
	 *
	 * @param {Blob} blob
	 * @returns {Promise} Promise that resolves with the binary string
	 */
	function blobToBinaryString(blob) {
	  return new Promise(function (resolve, reject) {
	    var reader = new FileReader();
	    var hasBinaryString = typeof reader.readAsBinaryString === 'function';
	    reader.onloadend = function (e) {
	      var result = e.target.result || '';
	      if (hasBinaryString) {
	        return resolve(result);
	      }
	      resolve(arrayBufferToBinaryString(result));
	    };
	    reader.onerror = reject;
	    if (hasBinaryString) {
	      reader.readAsBinaryString(blob);
	    } else {
	      reader.readAsArrayBuffer(blob);
	    }
	  });
	}
	
	/**
	 * Convert a base64-encoded string to a <code>Blob</code>. Returns a Promise.
	 * @param {string} base64
	 * @param {string|undefined} type - the content type (optional)
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function base64StringToBlob(base64, type) {
	  return Promise.resolve().then(function () {
	    var parts = [binaryStringToArrayBuffer(atob(base64))];
	    return type ? createBlob(parts, {type: type}) : createBlob(parts);
	  });
	}
	
	/**
	 * Convert a binary string to a <code>Blob</code>. Returns a Promise.
	 * @param {string} binary
	 * @param {string|undefined} type - the content type (optional)
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function binaryStringToBlob(binary, type) {
	  return Promise.resolve().then(function () {
	    return base64StringToBlob(btoa(binary), type);
	  });
	}
	
	/**
	 * Convert a <code>Blob</code> to a binary string. Returns a Promise.
	 * @param {Blob} blob
	 * @returns {Promise} Promise that resolves with the binary string
	 */
	function blobToBase64String(blob) {
	  return blobToBinaryString(blob).then(function (binary) {
	    return btoa(binary);
	  });
	}
	
	/**
	 * Convert a data URL string
	 * (e.g. <code>'data:image/png;base64,iVBORw0KG...'</code>)
	 * to a <code>Blob</code>. Returns a Promise.
	 * @param {string} dataURL
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function dataURLToBlob(dataURL) {
	  return Promise.resolve().then(function () {
	    var type = dataURL.match(/data:([^;]+)/)[1];
	    var base64 = dataURL.replace(/^[^,]+,/, '');
	
	    var buff = binaryStringToArrayBuffer(atob(base64));
	    return createBlob([buff], {type: type});
	  });
	}
	
	/**
	 * Convert an image's <code>src</code> URL to a data URL by loading the image and painting
	 * it to a <code>canvas</code>. Returns a Promise.
	 *
	 * <p/>Note: this will coerce the image to the desired content type, and it
	 * will only paint the first frame of an animated GIF.
	 *
	 * @param {string} src
	 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
	 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
	 *                                         'Anonymous' to avoid "tainted canvas" errors
	 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
	 *                                     if the requested type is 'image/jpeg' or 'image/webp'
	 * @returns {Promise} Promise that resolves with the data URL string
	 */
	function imgSrcToDataURL(src, type, crossOrigin, quality) {
	  type = type || 'image/png';
	
	  return loadImage(src, crossOrigin).then(function (img) {
	    return imgToCanvas(img);
	  }).then(function (canvas) {
	    return canvas.toDataURL(type, quality);
	  });
	}
	
	/**
	 * Convert a <code>canvas</code> to a <code>Blob</code>. Returns a Promise.
	 * @param {string} canvas
	 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
	 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
	 *                                     if the requested type is 'image/jpeg' or 'image/webp'
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function canvasToBlob(canvas, type, quality) {
	  return Promise.resolve().then(function () {
	    if (typeof canvas.toBlob === 'function') {
	      return new Promise(function (resolve) {
	        canvas.toBlob(resolve, type, quality);
	      });
	    }
	    return dataURLToBlob(canvas.toDataURL(type, quality));
	  });
	}
	
	/**
	 * Convert an image's <code>src</code> URL to a <code>Blob</code> by loading the image and painting
	 * it to a <code>canvas</code>. Returns a Promise.
	 *
	 * <p/>Note: this will coerce the image to the desired content type, and it
	 * will only paint the first frame of an animated GIF.
	 *
	 * @param {string} src
	 * @param {string|undefined} type - the content type (optional, defaults to 'image/png')
	 * @param {string|undefined} crossOrigin - for CORS-enabled images, set this to
	 *                                         'Anonymous' to avoid "tainted canvas" errors
	 * @param {number|undefined} quality - a number between 0 and 1 indicating image quality
	 *                                     if the requested type is 'image/jpeg' or 'image/webp'
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function imgSrcToBlob(src, type, crossOrigin, quality) {
	  type = type || 'image/png';
	
	  return loadImage(src, crossOrigin).then(function (img) {
	    return imgToCanvas(img);
	  }).then(function (canvas) {
	    return canvasToBlob(canvas, type, quality);
	  });
	}
	
	/**
	 * Convert an <code>ArrayBuffer</code> to a <code>Blob</code>. Returns a Promise.
	 *
	 * @param {ArrayBuffer} buffer
	 * @param {string|undefined} type - the content type (optional)
	 * @returns {Promise} Promise that resolves with the <code>Blob</code>
	 */
	function arrayBufferToBlob(buffer, type) {
	  return Promise.resolve().then(function () {
	    return createBlob([buffer], type);
	  });
	}
	
	/**
	 * Convert a <code>Blob</code> to an <code>ArrayBuffer</code>. Returns a Promise.
	 * @param {Blob} blob
	 * @returns {Promise} Promise that resolves with the <code>ArrayBuffer</code>
	 */
	function blobToArrayBuffer(blob) {
	  return new Promise(function (resolve, reject) {
	    var reader = new FileReader();
	    reader.onloadend = function (e) {
	      var result = e.target.result || new ArrayBuffer(0);
	      resolve(result);
	    };
	    reader.onerror = reject;
	    reader.readAsArrayBuffer(blob);
	  });
	}
	
	module.exports = {
	  createBlob         : createBlob,
	  createObjectURL    : createObjectURL,
	  revokeObjectURL    : revokeObjectURL,
	  imgSrcToBlob       : imgSrcToBlob,
	  imgSrcToDataURL    : imgSrcToDataURL,
	  canvasToBlob       : canvasToBlob,
	  dataURLToBlob      : dataURLToBlob,
	  blobToBase64String : blobToBase64String,
	  base64StringToBlob : base64StringToBlob,
	  binaryStringToBlob : binaryStringToBlob,
	  blobToBinaryString : blobToBinaryString,
	  arrayBufferToBlob  : arrayBufferToBlob,
	  blobToArrayBuffer  : blobToArrayBuffer
	};


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {/**
	 * Create a blob builder even when vendor prefixes exist
	 */
	
	var BlobBuilder = global.BlobBuilder
	  || global.WebKitBlobBuilder
	  || global.MSBlobBuilder
	  || global.MozBlobBuilder;
	
	/**
	 * Check if Blob constructor is supported
	 */
	
	var blobSupported = (function() {
	  try {
	    var a = new Blob(['hi']);
	    return a.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();
	
	/**
	 * Check if Blob constructor supports ArrayBufferViews
	 * Fails in Safari 6, so we need to map to ArrayBuffers there.
	 */
	
	var blobSupportsArrayBufferView = blobSupported && (function() {
	  try {
	    var b = new Blob([new Uint8Array([1,2])]);
	    return b.size === 2;
	  } catch(e) {
	    return false;
	  }
	})();
	
	/**
	 * Check if BlobBuilder is supported
	 */
	
	var blobBuilderSupported = BlobBuilder
	  && BlobBuilder.prototype.append
	  && BlobBuilder.prototype.getBlob;
	
	/**
	 * Helper function that maps ArrayBufferViews to ArrayBuffers
	 * Used by BlobBuilder constructor and old browsers that didn't
	 * support it in the Blob constructor.
	 */
	
	function mapArrayBufferViews(ary) {
	  for (var i = 0; i < ary.length; i++) {
	    var chunk = ary[i];
	    if (chunk.buffer instanceof ArrayBuffer) {
	      var buf = chunk.buffer;
	
	      // if this is a subarray, make a copy so we only
	      // include the subarray region from the underlying buffer
	      if (chunk.byteLength !== buf.byteLength) {
	        var copy = new Uint8Array(chunk.byteLength);
	        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
	        buf = copy.buffer;
	      }
	
	      ary[i] = buf;
	    }
	  }
	}
	
	function BlobBuilderConstructor(ary, options) {
	  options = options || {};
	
	  var bb = new BlobBuilder();
	  mapArrayBufferViews(ary);
	
	  for (var i = 0; i < ary.length; i++) {
	    bb.append(ary[i]);
	  }
	
	  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
	};
	
	function BlobConstructor(ary, options) {
	  mapArrayBufferViews(ary);
	  return new Blob(ary, options || {});
	};
	
	module.exports = (function() {
	  if (blobSupported) {
	    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
	  } else if (blobBuilderSupported) {
	    return BlobBuilderConstructor;
	  } else {
	    return undefined;
	  }
	})();
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = typeof Promise === 'function' ? Promise : __webpack_require__(5);


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var immediate = __webpack_require__(6);
	
	/* istanbul ignore next */
	function INTERNAL() {}
	
	var handlers = {};
	
	var REJECTED = ['REJECTED'];
	var FULFILLED = ['FULFILLED'];
	var PENDING = ['PENDING'];
	
	module.exports = Promise;
	
	function Promise(resolver) {
	  if (typeof resolver !== 'function') {
	    throw new TypeError('resolver must be a function');
	  }
	  this.state = PENDING;
	  this.queue = [];
	  this.outcome = void 0;
	  if (resolver !== INTERNAL) {
	    safelyResolveThenable(this, resolver);
	  }
	}
	
	Promise.prototype["catch"] = function (onRejected) {
	  return this.then(null, onRejected);
	};
	Promise.prototype.then = function (onFulfilled, onRejected) {
	  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
	    typeof onRejected !== 'function' && this.state === REJECTED) {
	    return this;
	  }
	  var promise = new this.constructor(INTERNAL);
	  if (this.state !== PENDING) {
	    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
	    unwrap(promise, resolver, this.outcome);
	  } else {
	    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
	  }
	
	  return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
	  this.promise = promise;
	  if (typeof onFulfilled === 'function') {
	    this.onFulfilled = onFulfilled;
	    this.callFulfilled = this.otherCallFulfilled;
	  }
	  if (typeof onRejected === 'function') {
	    this.onRejected = onRejected;
	    this.callRejected = this.otherCallRejected;
	  }
	}
	QueueItem.prototype.callFulfilled = function (value) {
	  handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function (value) {
	  unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function (value) {
	  handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function (value) {
	  unwrap(this.promise, this.onRejected, value);
	};
	
	function unwrap(promise, func, value) {
	  immediate(function () {
	    var returnValue;
	    try {
	      returnValue = func(value);
	    } catch (e) {
	      return handlers.reject(promise, e);
	    }
	    if (returnValue === promise) {
	      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
	    } else {
	      handlers.resolve(promise, returnValue);
	    }
	  });
	}
	
	handlers.resolve = function (self, value) {
	  var result = tryCatch(getThen, value);
	  if (result.status === 'error') {
	    return handlers.reject(self, result.value);
	  }
	  var thenable = result.value;
	
	  if (thenable) {
	    safelyResolveThenable(self, thenable);
	  } else {
	    self.state = FULFILLED;
	    self.outcome = value;
	    var i = -1;
	    var len = self.queue.length;
	    while (++i < len) {
	      self.queue[i].callFulfilled(value);
	    }
	  }
	  return self;
	};
	handlers.reject = function (self, error) {
	  self.state = REJECTED;
	  self.outcome = error;
	  var i = -1;
	  var len = self.queue.length;
	  while (++i < len) {
	    self.queue[i].callRejected(error);
	  }
	  return self;
	};
	
	function getThen(obj) {
	  // Make sure we only access the accessor once as required by the spec
	  var then = obj && obj.then;
	  if (obj && typeof obj === 'object' && typeof then === 'function') {
	    return function appyThen() {
	      then.apply(obj, arguments);
	    };
	  }
	}
	
	function safelyResolveThenable(self, thenable) {
	  // Either fulfill, reject or reject with error
	  var called = false;
	  function onError(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.reject(self, value);
	  }
	
	  function onSuccess(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.resolve(self, value);
	  }
	
	  function tryToUnwrap() {
	    thenable(onSuccess, onError);
	  }
	
	  var result = tryCatch(tryToUnwrap);
	  if (result.status === 'error') {
	    onError(result.value);
	  }
	}
	
	function tryCatch(func, value) {
	  var out = {};
	  try {
	    out.value = func(value);
	    out.status = 'success';
	  } catch (e) {
	    out.status = 'error';
	    out.value = e;
	  }
	  return out;
	}
	
	Promise.resolve = resolve;
	function resolve(value) {
	  if (value instanceof this) {
	    return value;
	  }
	  return handlers.resolve(new this(INTERNAL), value);
	}
	
	Promise.reject = reject;
	function reject(reason) {
	  var promise = new this(INTERNAL);
	  return handlers.reject(promise, reason);
	}
	
	Promise.all = all;
	function all(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }
	
	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }
	
	  var values = new Array(len);
	  var resolved = 0;
	  var i = -1;
	  var promise = new this(INTERNAL);
	
	  while (++i < len) {
	    allResolver(iterable[i], i);
	  }
	  return promise;
	  function allResolver(value, i) {
	    self.resolve(value).then(resolveFromAll, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	    function resolveFromAll(outValue) {
	      values[i] = outValue;
	      if (++resolved === len && !called) {
	        called = true;
	        handlers.resolve(promise, values);
	      }
	    }
	  }
	}
	
	Promise.race = race;
	function race(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }
	
	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }
	
	  var i = -1;
	  var promise = new this(INTERNAL);
	
	  while (++i < len) {
	    resolver(iterable[i]);
	  }
	  return promise;
	  function resolver(value) {
	    self.resolve(value).then(function (response) {
	      if (!called) {
	        called = true;
	        handlers.resolve(promise, response);
	      }
	    }, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	  }
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;
	
	var scheduleDrain;
	
	{
	  if (Mutation) {
	    var called = 0;
	    var observer = new Mutation(nextTick);
	    var element = global.document.createTextNode('');
	    observer.observe(element, {
	      characterData: true
	    });
	    scheduleDrain = function () {
	      element.data = (called = ++called % 2);
	    };
	  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
	    var channel = new global.MessageChannel();
	    channel.port1.onmessage = nextTick;
	    scheduleDrain = function () {
	      channel.port2.postMessage(0);
	    };
	  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
	    scheduleDrain = function () {
	
	      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	      var scriptEl = global.document.createElement('script');
	      scriptEl.onreadystatechange = function () {
	        nextTick();
	
	        scriptEl.onreadystatechange = null;
	        scriptEl.parentNode.removeChild(scriptEl);
	        scriptEl = null;
	      };
	      global.document.documentElement.appendChild(scriptEl);
	    };
	  } else {
	    scheduleDrain = function () {
	      setTimeout(nextTick, 0);
	    };
	  }
	}
	
	var draining;
	var queue = [];
	//named nextTick for less confusing stack traces
	function nextTick() {
	  draining = true;
	  var i, oldQueue;
	  var len = queue.length;
	  while (len) {
	    oldQueue = queue;
	    queue = [];
	    i = -1;
	    while (++i < len) {
	      oldQueue[i]();
	    }
	    len = queue.length;
	  }
	  draining = false;
	}
	
	module.exports = immediate;
	function immediate(task) {
	  if (queue.push(task) === 1 && !draining) {
	    scheduleDrain();
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.AssetManager = undefined;
	
	var _blobUtil = __webpack_require__(2);
	
	var BlobUtil = _interopRequireWildcard(_blobUtil);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var fileProviders = [];
	var assetLoaders = [];
	var assets = {};
	var placeholders = {};
	var loadingQueue = [];
	
	var AssetPlaceholder = function AssetPlaceholder(spec) {
	  var self = { spec: spec, id: spec.id };
	
	  var state = {};
	
	  self.state = "unbound";
	
	  self.promise = new Promise(function (resolve, reject) {
	    state.resolve = resolve;
	    state.reject = reject;
	  });
	
	  self.promise.then(function (value) {
	    self.state = "loaded";
	    self.value = value;
	  }, function (err) {
	    self.state = "error";
	    self.error = err;
	  });
	
	  self.bind = function (promise) {
	    self.state = "loading";
	    promise.then(state.resolve, state.reject);
	    return self.promise;
	  };
	
	  self.dependencies = [];
	  self.dependants = [];
	
	  self.depend = function (id) {
	    var ph = AssetManager.getPlaceholder(id);
	    if (!ph) {
	      throw "No such asset '" + id + "' has been discovered";
	    }
	    var verifyDepTree = function verifyDepTree(node) {
	      if (node.id == self.id) {
	        return [self.id];
	      }
	
	      for (var i = 0; i < node.dependencies.length; i++) {
	        var _loop = verifyDepTree(i);
	        if (_loop) {
	          return _loop.push(node.id);
	        }
	      }
	    };
	    var loop = verifyDepTree(ph);
	    if (!loop) {
	      self.dependencies.push(ph);
	      ph.dependants.push(self);
	      return ph.promise;
	    } else {
	      throw "Dependency loop: " + loop.join(" -> ");
	    }
	  };
	
	  return self;
	};
	
	var AssetManager = exports.AssetManager = {
	  GroupDownloadState: {
	    DISCOVERING: {
	      description: "Discovering assets"
	    },
	    DOWNLOADING: {
	      description: "Downloading assets"
	    }
	  },
	
	  getFile: function getFile(file) {
	    var attempt = function attempt(i) {
	      var provider = fileProviders[i];
	      return provider.getFile(file).catch(function (error) {
	        if (i < fileProviders.length - 1) {
	          return attempt(i + 1);
	        } else {
	          throw error;
	        }
	      });
	    };
	    return attempt(0);
	  },
	  getPlaceholder: function getPlaceholder(id) {
	    if (!placeholders[id]) {
	      throw "No such asset '" + id + "' has been discovered";
	    }
	    return placeholders[id];
	  },
	  getAsset: function getAsset(id) {
	    if (!placeholders[id]) {
	      throw "No such asset '" + id + "' has been discovered";
	    }
	    if (!placeholders[id].value) {
	      throw "Asset '" + id + "' has not yet been loaded";
	    }
	    return placeholders[id].value;
	  },
	  downloadAssetGroup: function downloadAssetGroup(name) {
	    var promise = this.getFile(name + ".asgroup").then(function (blob) {
	      return BlobUtil.blobToBinaryString(blob);
	    }, function (err) {
	      throw err + " while discovering assets in group " + name;
	    }).then(function (string) {
	      return JSON.parse(string);
	    }).then(function (json) {
	      for (var i = 0; i < json.length; i++) {
	        var spec = json[i];
	        loadingQueue.push(placeholders[spec.id] = AssetPlaceholder(spec));
	      }
	
	      var promises = [];
	
	      var _loop2 = function _loop2(_i2) {
	        var placeholder = loadingQueue[_i2];
	
	        var foundLoader = false;
	        for (var j = 0; j < assetLoaders.length; _i2++) {
	          if (assetLoaders[j].canLoad(placeholder)) {
	            foundLoader = true;
	            promises.push(placeholder.bind(assetLoaders[j].load(placeholder)).catch(function (err) {
	              throw err + " while loading " + placeholder.spec.id;
	            }));
	            break;
	          }
	        }
	
	        if (!foundLoader) {
	          throw "No loader found for spec " + JSON.stringify(placeholder.spec);
	        }
	        _i = _i2;
	      };
	
	      for (var _i = 0; _i < loadingQueue.length; _i++) {
	        _loop2(_i);
	      }
	
	      return Promise.all(promises);
	    });
	
	    promise.dlState = this.GroupDownloadState.DISCOVERING;
	    return promise;
	  },
	  addFileProvider: function addFileProvider(provider) {
	    fileProviders.push(provider);
	    fileProviders.sort(function (a, b) {
	      return Math.sign(b.priority - a.priority);
	    });
	  },
	  addAssetLoader: function addAssetLoader(loader) {
	    assetLoaders.push(loader);
	  }
	};
	
	AssetManager.addFileProvider({ // download over the network
	  priority: -1000,
	  getFile: function getFile(name) {
	    return fetch("/assets/" + name).then(function (response) {
	      if (!response.ok) {
	        throw "HTTP " + response.status + " " + response.statusText + " while downloading /assets/" + name;
	      }
	      return response.blob();
	    });
	  }
	});

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var Mat4 = exports.Mat4 = {
	  create: function create() {
	    var multBuffer = [[], [], [], []];
	
	    var gl = new Float32Array(16);
	
	    var self = {
	      val: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
	
	      toGL: function toGL() {
	        for (var i = 0; i < 4; i++) {
	          for (var j = 0; j < 4; j++) {
	            gl[i * 4 + j] = self.val[i][j];
	          }
	        }
	
	        return gl;
	      },
	      copy: function copy(src) {
	        for (var i = 0; i < 4; i++) {
	          for (var j = 0; j < 4; j++) {
	            self.val[i][j] = src.val[i][j];
	          }
	        }
	      },
	
	
	      load: {
	        identity: function identity() {
	          self.copy(Mat4.identity);
	        },
	        translate: function translate(x, y, z) {
	          self.load.identity();
	          self.val[3][0] = x;
	          self.val[3][1] = y;
	          self.val[3][2] = z;
	        },
	        scale: function scale(x, y, z) {
	          self.load.identity();
	          self.val[0][0] = x;
	          self.val[1][1] = y;
	          self.val[2][2] = z;
	        },
	        rotate: function rotate(rad) {
	          self.load.identity();
	          self.val[0][0] = Math.cos(rad);
	          self.val[1][0] = -Math.sin(rad);
	          self.val[0][1] = Math.sin(rad);
	          self.val[1][1] = Math.cos(rad);
	        }
	      },
	
	      multiply: function multiply(bMat) {
	        var b = self.val;
	        var a = bMat.val;
	
	        for (var i = 0; i < 4; i++) {
	          for (var j = 0; j < 4; j++) {
	            multBuffer[i][j] = 0;
	            for (var k = 0; k < 4; k++) {
	              multBuffer[i][j] += a[i][k] * b[k][j];
	            }
	          }
	        }
	
	        for (var _i = 0; _i < 4; _i++) {
	          for (var _j = 0; _j < 4; _j++) {
	            self.val[_i][_j] = multBuffer[_i][_j];
	          }
	        }
	      }
	    };
	
	    return self;
	  }
	};
	
	Mat4.identity = Mat4.create();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.PreloaderState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _loader = __webpack_require__(11);
	
	var PreloaderState = exports.PreloaderState = function PreloaderState(game) {
	  var render = game.render;
	
	  var time = 0;
	  var uniformTickTimer = 0;
	
	  var promise = void 0;
	
	  return {
	    initialize: function initialize() {
	      promise = _assetmgr.AssetManager.downloadAssetGroup("base");
	      promise.then(function () {
	        game.switchState((0, _loader.LoaderState)(game));
	      }, function (err) {
	        console.log("failed to load assets: " + err);
	      });
	    },
	    uniformTick: function uniformTick() {// 200hz
	    },
	    tick: function tick(delta) {
	      // variable framerate
	      time += delta;
	      uniformTickTimer += delta;
	
	      if (uniformTickTimer > 5) {
	        uniformTickTimer -= 5;
	        this.uniformTick();
	      }
	
	      render.clear(_gfxutils.Colors.BLACK);
	    }
	  };
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var Color = exports.Color = function Color(r, g, b, a) {
	  return {
	    r: r, g: g, b: b, a: a
	  };
	};
	
	var Colors = exports.Colors = {
	  BLACK: Color(0, 0, 0, 1),
	  WHITE: Color(1, 1, 1, 1),
	  RED: Color(1, 0, 0, 1),
	  GREEN: Color(0, 1, 0, 1),
	  BLUE: Color(0, 0, 1, 1)
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.LoaderState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var LoaderState = exports.LoaderState = function LoaderState(game) {
	  var render = game.render;
	  var hud = render.createLayer(_assetmgr.AssetManager.getAsset("base.shader.flat.color"));
	  var main = render.createLayer(_assetmgr.AssetManager.getAsset("base.shader.flat.color"));
	  var tex = render.createLayer(_assetmgr.AssetManager.getAsset("base.shader.flat.textured"));
	  var rects = hud.createRectDrawer();
	  var mr = main.createRectDrawer();
	  var texdrawer = main.createRectDrawer();
	  var workingMatrix = _math.Mat4.create();
	  var time = 0;
	
	  return {
	    initialize: function initialize() {},
	    tick: function tick(delta) {
	      time += delta;
	
	      render.clear(_gfxutils.Colors.BLUE);
	
	      hud.matrix.load.identity();
	      main.matrix.load.identity();
	      tex.matrix.load.identity();
	
	      workingMatrix.load.scale(2 / render.width(), -2 / render.height(), 1); // scale down to pixels and flip
	      hud.matrix.multiply(workingMatrix);
	      main.matrix.multiply(workingMatrix);
	      tex.matrix.multiply(workingMatrix);
	
	      workingMatrix.load.translate(render.width() / -2, render.height() / -2, 0);
	      hud.matrix.multiply(workingMatrix); // make origin upper-left corner
	      tex.matrix.multiply(workingMatrix);
	
	      workingMatrix.load.translate(render.width() % 2 / 2 + 0, render.height() % 2 / 2, 0); // align to pixels
	      main.matrix.multiply(workingMatrix);
	
	      workingMatrix.load.rotate(time / 500.0);
	      main.matrix.multiply(workingMatrix);
	
	      rects.drawColoredRect(_gfxutils.Colors.GREEN, 0, 0, 300, 300);
	      mr.drawColoredRect(_gfxutils.Colors.RED, -50, -50, 50, 50);
	
	      hud.flush();
	      main.flush();
	      tex.flush();
	    }
	  };
	};

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map