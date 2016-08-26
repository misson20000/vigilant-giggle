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
	
	var _sound = __webpack_require__(22);
	
	var game = {};
	window.theGame = game;
	
	window.onload = function () {
	  try {
	    var canvas = document.getElementById("gamecanvas");
	    game.render = (0, _webgl.WebGLRenderer)(game, canvas, canvas.getContext("webgl", {
	      alpha: false,
	      stencil: true
	    }) || canvas.getContext("experimental-webgl", {
	      alpha: false,
	      stencil: true
	    }));
	    game.sound = (0, _sound.SoundEngine)(game);
	    game.mouse = { x: 0, y: 0 };
	
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
	    _assetmgr.AssetManager.addAssetLoader(game.sound.createAssetLoader());
	  } catch (err) {
	    document.write(err);
	    return;
	  }
	
	  var lastTick = performance.now();
	  game.tick = function (timestamp) {
	    var delta = timestamp - lastTick;
	    lastTick = timestamp;
	
	    game.render.manageSize();
	    game.render.initMatrices();
	    game.render.clearBuffers();
	
	    if (game.state && game.state.tick) {
	      game.state.tick(delta);
	    }
	
	    if (game.state && game.state.getKeyboard) {
	      game.state.getKeyboard().update();
	    }
	
	    window.requestAnimationFrame(game.tick);
	  };
	  window.requestAnimationFrame(game.tick);
	
	  document.addEventListener("keydown", function (evt) {
	    if (game.state && game.state.getKeyboard) {
	      game.state.getKeyboard().keyDown(evt);
	    }
	  });
	
	  document.addEventListener("keyup", function (evt) {
	    if (game.state && game.state.getKeyboard) {
	      game.state.getKeyboard().keyUp(evt);
	    }
	  });
	
	  document.addEventListener("mousemove", function (evt) {
	    game.mouse.x = evt.clientX;
	    game.mouse.y = evt.clientY;
	  });
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
	  if (!gl) {
	    if (!canvas.getContext("webgl")) {
	      throw "Could not open any WebGL context";
	    }
	    if (!canvas.getContext("webgl", { alpha: false })) {
	      throw "Could not open WebGL context {alpha: false}";
	    }
	    if (!canvas.getContext("webgl", { stencil: true })) {
	      throw "Could not open WebGL context with stencil";
	    }
	    if (!canvas.getContext("webgl", { alpha: false, stencil: true })) {
	      throw "Could not open WebGL context with no alpha and with stencil";
	    }
	    throw "Could not open WebGL context";
	  }
	  gl.enable(gl.BLEND);
	  gl.disable(gl.STENCIL_TEST);
	  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	  gl.stencilFunc(gl.ALWAYS, 0, 0xFF); // fill stencil buffer with ones
	  gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
	  gl.stencilMask(0);
	
	  var workingMatrix = _math.Mat4.create();
	  var currentFb = null;
	
	  var render = {
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
	    initMatrices: function initMatrices() {
	      render.pixelMatrix.load.identity();
	      render.pixelCenteredMatrix.load.identity();
	      workingMatrix.load.scale(2 / render.fbwidth(), -2 / render.fbheight(), 1); // scale down to pixels and flip
	      render.pixelMatrix.multiply(workingMatrix);
	      render.pixelCenteredMatrix.multiply(workingMatrix);
	      workingMatrix.load.translate(-render.fbwidth() / 2, -render.fbheight() / 2, 0);
	      render.pixelMatrix.multiply(workingMatrix);
	    },
	    clearBuffers: function clearBuffers() {
	      gl.clearColor(0, 0, 0, 1);
	      gl.clearStencil(0);
	      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
	    },
	    clear: function clear(color) {
	      gl.clearColor(color.r, color.g, color.b, color.a);
	      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	    },
	    drawStencil: function drawStencil() {
	      gl.stencilMask(0xFF);
	      gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // write ones to stencil buffer
	      gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
	      gl.colorMask(0, 0, 0, 0);
	    },
	    drawColor: function drawColor() {
	      gl.stencilMask(0x00); // disable writing to stencil buffer
	      gl.stencilFunc(gl.EQUAL, 1, 0xFF);
	      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
	      gl.colorMask(1, 1, 1, 1);
	    },
	    setStencil: function setStencil(enabled) {
	      if (enabled) {
	        gl.enable(gl.STENCIL_TEST);
	      } else {
	        gl.disable(gl.STENCIL_TEST);
	      }
	    },
	
	
	    // padding is extra space beyond the edges of the canvas that is guarenteed to be there
	    // margin space is not guarenteed to be there; it serves only to make resizing smoother
	    //  margin defaults to 50 pixels
	    createFramebuffer: function createFramebuffer(padding, margin) {
	      if (margin === undefined) {
	        margin = 50;
	      }
	
	      var fb = gl.createFramebuffer();
	      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	
	      var width = render.width() + 2 * padding + 2 * margin;
	      var height = render.height() + 2 * padding + 2 * margin;
	
	      var tex = gl.createTexture();
	      gl.bindTexture(gl.TEXTURE_2D, tex);
	      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	      var depthrb = gl.createRenderbuffer();
	      gl.bindRenderbuffer(gl.RENDERBUFFER, depthrb);
	      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthrb);
	      // Unfortunately, no stencilling in framebuffers cause we can't have the depth and stencil
	      // buffers be seperate renderbufferes and there's no way to have them both in the same
	      // renderbuffer until WebGL2.
	      //      let stencilrb = gl.createRenderbuffer();
	      //      gl.bindRenderbuffer(gl.RENDERBUFFER, stencilrb);
	      //      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
	      //      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencilrb);
	
	      switch (gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
	        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
	          throw "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
	        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
	          throw "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
	        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
	          throw "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
	        case gl.FRAMEBUFFER_UNSUPPORTED:
	          throw "FRAMEBUFFER_UNSUPPORTED";
	        case gl.FRAMEBUFFER_COMPLETE:
	          break;
	        default:
	          throw "WTF?";
	      }
	
	      gl.bindTexture(gl.TEXTURE_2D, null);
	      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	      var texObj = {
	        glTex: tex,
	        width: width,
	        height: height
	      };
	
	      var attributes = [];
	
	      var pixmat = _math.Mat4.create();
	      var pixcentmat = _math.Mat4.create();
	
	      var self = {
	        bind: function bind() {
	          if (render.width() + 2 * padding > width || render.height() + 2 * padding > height) {
	            width = render.width() + 2 * padding + 2 * margin;
	            height = render.height() + 2 * padding + 2 * margin;
	            texObj.width = width;
	            texObj.height = height;
	            gl.bindTexture(gl.TEXTURE_2D, tex);
	            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	            gl.bindRenderbuffer(gl.RENDERBUFFER, depthrb);
	            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	            gl.bindTexture(gl.TEXTURE_2D, null);
	            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	          }
	
	          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	          currentFb = texObj;
	
	          pixmat.load.from(render.pixelMatrix);
	          pixcentmat.load.from(render.pixelCenteredMatrix);
	          render.initMatrices();
	
	          workingMatrix.load.translate((width - render.width()) / 2, (height - render.height()) / 2, 0);
	          render.pixelMatrix.multiply(workingMatrix);
	          render.pixelCenteredMatrix.multiply(workingMatrix);
	          gl.viewport(0, 0, width, height);
	        },
	        unbind: function unbind() {
	          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	          currentFb = null;
	          render.pixelMatrix.load.from(pixmat);
	          render.pixelCenteredMatrix.load.from(pixcentmat);
	          gl.viewport(0, 0, canvas.width, canvas.height);
	        },
	        getTexture: function getTexture() {
	          return texObj;
	        },
	        getAttributes: function getAttributes() {
	          var i = 0;
	          var x = (width - render.width()) / (2 * width);
	          var y = (height - render.height()) / (2 * height);
	          attributes[i++] = 0;
	          attributes[i++] = 0;
	          attributes[i++] = 0;
	          attributes[i++] = x;
	          attributes[i++] = 1 - y;
	
	          attributes[i++] = render.width();
	          attributes[i++] = 0;
	          attributes[i++] = 0;
	          attributes[i++] = 1 - x;
	          attributes[i++] = 1 - y;
	
	          attributes[i++] = 0;
	          attributes[i++] = render.height();
	          attributes[i++] = 0;
	          attributes[i++] = x;
	          attributes[i++] = y;
	
	          attributes[i++] = render.width();
	          attributes[i++] = render.height();
	          attributes[i++] = 0;
	          attributes[i++] = 1 - x;
	          attributes[i++] = y;
	          return attributes;
	        },
	        xtoc: function xtoc(x) {
	          return (2 * x + width - render.width()) / (2 * width);
	        },
	        ytoc: function ytoc(y) {
	          return 1.0 - (2 * y + height - render.height()) / (2 * height);
	        }
	      };
	      return self;
	    },
	    width: function width() {
	      return canvas.width;
	    },
	    height: function height() {
	      return canvas.height;
	    },
	    fbwidth: function fbwidth() {
	      // including padding and margin
	      return currentFb === null ? canvas.width : currentFb.width;
	    },
	    fbheight: function fbheight() {
	      // including padding and margin
	      return currentFb === null ? canvas.height : currentFb.height;
	    },
	    createAssetLoader: function createAssetLoader() {
	      var loaders = {
	        "font": function font(placeholder) {
	          return _assetmgr.AssetManager.getFile(placeholder.spec.xml).then(function (blob) {
	            /*            return new Promise((resolve, reject) => {
	                          let xhr = new XMLHttpRequest();
	                          
	                          xhr.onload = () => {
	                            if(xhr.status != 200) {
	                              throw xhr.statusText;
	                            } else {
	                              resolve(xhr.responseXML);
	                            }
	                          };
	            
	                          xhr.onerror = reject;
	                          
	                          xhr.responseType = "document";
	                          
	                          xhr.open("GET", URL.createObjectURL(blob));
	                          xhr.send();
	                          });*/
	            return BlobUtil.blobToBinaryString(blob).then(function (str) {
	              return new DOMParser().parseFromString(str, "application/xml");
	            });
	          }).then(function (doc) {
	            var root = doc.firstChild;
	            if (root.nodeName != "Font") {
	              throw "Bad font descriptor file (root element is <" + root.nodeName + ">)";
	            }
	
	            var font = {
	              height: parseInt(root.getAttribute("height")),
	              glyphs: {}
	            };
	
	            for (var i = 0; i < root.children.length; i++) {
	              var ch = root.children[i];
	              var glyph = {};
	
	              var offset = ch.getAttribute("offset").split(" ");
	              glyph.offsetx = parseInt(offset[0]);
	              glyph.offsety = parseInt(offset[1]);
	
	              var rect = ch.getAttribute("rect").split(" ").map(function (str) {
	                return parseInt(str);
	              });
	              glyph.rectx = rect[0];
	              glyph.recty = rect[1];
	              glyph.rectw = rect[2];
	              glyph.recth = rect[3];
	
	              glyph.width = parseInt(ch.getAttribute("width"));
	
	              font.glyphs[ch.getAttribute("code")] = glyph;
	            }
	            return placeholder.depend(placeholder.spec.texture).then(function (tex) {
	              font.texture = tex;
	              return font;
	            });
	          });
	        },
	        "texture": function texture(placeholder) {
	          return _assetmgr.AssetManager.getFile(placeholder.spec.src).then(function (blob) {
	            return new Promise(function (resolve, reject) {
	              var image = new Image();
	              image.onload = function () {
	                resolve(image);
	              };
	              image.onerror = function (evt) {
	                reject(evt.type);
	              };
	              image.src = URL.createObjectURL(blob);
	            });
	          }).then(function (img) {
	            var texture = gl.createTexture();
	            gl.bindTexture(gl.TEXTURE_2D, texture);
	            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	            gl.generateMipmap(gl.TEXTURE_2D);
	            gl.bindTexture(gl.TEXTURE_2D, null);
	            return {
	              glTex: texture,
	              width: img.width,
	              height: img.height
	            };
	          });
	        },
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
	                      attrib.runtime.components[3] = 1;
	                      break;
	                    case "vec":
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
	
	              var uniforms = placeholder.spec.uniforms.map(function (uniform) {
	                var loc = gl.getUniformLocation(program, uniform.name);
	                if (loc == -1) {
	                  throw "Could not find uniform '" + uniform.name + "'";
	                }
	
	                uniform.location = loc;
	
	                return uniform;
	              });
	
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
	    createFontRenderer: function createFontRenderer(font, shader) {
	      var material = render.createMaterial(shader, {
	        matrix: render.pixelMatrix,
	        tex: font.texture
	      });
	
	      var rects = render.createShapeDrawer();
	      rects.useMaterial(material);
	
	      var self = {
	        height: font.height,
	        draw: function draw(color, x, y, string) {
	          for (var i = 0; i < string.length; i++) {
	            var glyph = font.glyphs[string[i]];
	
	            rects.drawTexturedAndColoredRect(color, x + glyph.offsetx, y + glyph.offsety, x + glyph.offsetx + glyph.rectw, y + glyph.offsety + glyph.recth, glyph.rectx / font.texture.width, glyph.recty / font.texture.height, (glyph.rectx + glyph.rectw) / font.texture.width, (glyph.recty + glyph.recth) / font.texture.height);
	
	            x += glyph.width;
	          }
	        },
	        useMatrix: function useMatrix(mat) {
	          rects.useMatrix(mat);
	        },
	        computeWidth: function computeWidth(string) {
	          var x = 0;
	
	          for (var i = 0; i < string.length; i++) {
	            var glyph = font.glyphs[string[i]];
	            x += glyph.width;
	          }
	
	          return x;
	        },
	        drawCentered: function drawCentered(color, x, y, string) {
	          self.draw(color, x - self.computeWidth(string) / 2, y, string);
	        },
	        flush: function flush() {
	          rects.flush();
	        }
	      };
	
	      return self;
	    },
	    createShapeDrawer: function createShapeDrawer() {
	      // trades flexibility for lack of allocations
	      var params = [];
	      var material = void 0;
	      var tform = _math.MatrixTransformer.create();
	
	      var self = {
	        useMaterial: function useMaterial(mat) {
	          if (material) {
	            material.flush();
	          }
	          material = mat;
	        },
	        useMatrix: function useMatrix(mat) {
	          tform.useMatrix(mat);
	        },
	        drawColoredRect: function drawColoredRect(color, x1, y1, x2, y2) {
	          var i = 0;
	          params[i++] = color;
	          i = tform.into(params, i, x1, y1, 0);
	          i = tform.into(params, i, x2, y1, 0);
	          i = tform.into(params, i, x1, y2, 0);
	          i = tform.into(params, i, x2, y2, 0);
	          material.drawQuad(params);
	        },
	        drawColoredTriangle: function drawColoredTriangle(color, x1, y1, x2, y2, x3, y3) {
	          var i = 0;
	          params[i++] = color;
	          i = tform.into(params, i, x1, y1, 0);
	          i = tform.into(params, i, x2, y2, 0);
	          i = tform.into(params, i, x3, y3, 0);
	          material.drawTri(params);
	        },
	        drawTexturedRect: function drawTexturedRect(x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
	          var i = 0;
	          i = tform.into(params, i, x1, y1, 0);
	          params[i++] = tx1;
	          params[i++] = ty1;
	          i = tform.into(params, i, x2, y1, 0);
	          params[i++] = tx2;
	          params[i++] = ty1;
	          i = tform.into(params, i, x1, y2, 0);
	          params[i++] = tx1;
	          params[i++] = ty2;
	          i = tform.into(params, i, x2, y2, 0);
	          params[i++] = tx2;
	          params[i++] = ty2;
	          material.drawQuad(params);
	        },
	        drawTexturedAndColoredRect: function drawTexturedAndColoredRect(c, x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
	          var i = 0;
	          params[i++] = c;
	          i = tform.into(params, i, x1, y1, 0);
	          params[i++] = tx1;
	          params[i++] = ty1;
	          i = tform.into(params, i, x2, y1, 0);
	          params[i++] = tx2;
	          params[i++] = ty1;
	          i = tform.into(params, i, x1, y2, 0);
	          params[i++] = tx1;
	          params[i++] = ty2;
	          i = tform.into(params, i, x2, y2, 0);
	          params[i++] = tx2;
	          params[i++] = ty2;
	          material.drawQuad(params);
	        },
	        flush: function flush() {
	          material.flush();
	        }
	      };
	      return self;
	    },
	
	
	    pixelMatrix: _math.Mat4.create(),
	    pixelCenteredMatrix: _math.Mat4.create(),
	
	    createMaterial: function createMaterial(shader, uniforms) {
	      var triangles = 2048;
	
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
	
	      var buffer = new Float32Array(triangles * 3 // 3 vertices per triangle
	      * shader.runtime.numComponents);
	      var bp = 0; // buffer pos
	      var numTris = 0;
	
	      gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);
	
	      var bufferFromAttributes = function bufferFromAttributes() {
	        for (var _i = 0; _i < shader.attributes.length; _i++) {
	          var _attrib = shader.attributes[_i];
	          for (var j = 0; j < _attrib.components; j++) {
	            buffer[bp++] = _attrib.runtime.components[j];
	          }
	        }
	      };
	
	      var self = {
	        drawQuad: function drawQuad(args) {
	          if (numTris + 2 > triangles) {
	            self.flush();
	          }
	
	          var argI = 0;
	          for (var _i2 = 0; _i2 < perShape.length; _i2++) {
	            argI = perShape[_i2].runtime.loadData(args, argI);
	          }
	
	          for (var _i3 = 0; _i3 < perVertex.length; _i3++) {
	            argI = perVertex[_i3].runtime.loadData(args, argI);
	          }
	          bufferFromAttributes();
	          var tri2argI = argI;
	          for (var h = 0; h < 2; h++) {
	            for (var _i4 = 0; _i4 < perVertex.length; _i4++) {
	              argI = perVertex[_i4].runtime.loadData(args, argI);
	            }
	            bufferFromAttributes();
	          }
	          argI = tri2argI; //rewind argument iterator to where it was after the first vertex was read
	          for (var _h = 0; _h < 3; _h++) {
	            for (var _i5 = 0; _i5 < perVertex.length; _i5++) {
	              argI = perVertex[_i5].runtime.loadData(args, argI);
	            }
	            bufferFromAttributes();
	          }
	
	          numTris += 2;
	        },
	        drawTri: function drawTri(args) {
	          if (numTris + 1 > triangles) {
	            self.flush();
	          }
	
	          var argI = 0;
	          for (var _i6 = 0; _i6 < perShape.length; _i6++) {
	            argI = perShape[_i6].runtime.loadData(args, argI);
	          }
	          for (var _i7 = 0; _i7 < 3; _i7++) {
	            for (var j = 0; j < perVertex.length; j++) {
	              argI = perVertex[j].runtime.loadData(args, argI);
	            }
	            bufferFromAttributes();
	          }
	
	          numTris++;
	        },
	
	
	        flush: function flush() {
	          gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	          gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer);
	
	          gl.useProgram(shader.program);
	
	          for (var _i8 = 0; _i8 < shader.attributes.length; _i8++) {
	            var _attrib2 = shader.attributes[_i8];
	            gl.enableVertexAttribArray(_attrib2.location);
	            gl.vertexAttribPointer(_attrib2.location, _attrib2.components, gl.FLOAT, false, shader.runtime.stride, _attrib2.runtime.offset);
	          }
	
	          var texunit = 0;
	          for (var _i9 = 0; _i9 < shader.uniforms.length; _i9++) {
	            var uniform = shader.uniforms[_i9];
	
	            var value = uniforms[uniform.name];
	            if (shader.uniforms[_i9].callback) {
	              value = value();
	            }
	
	            switch (shader.uniforms[_i9].datatype) {
	              case "mat4":
	                gl.uniformMatrix4fv(uniform.location, false, value.toGL());
	                break;
	              case "tex2d":
	                gl.activeTexture(gl.TEXTURE0 + texunit);
	                gl.bindTexture(gl.TEXTURE_2D, value.glTex);
	                gl.uniform1i(uniform.location, texunit);
	                texunit++;
	                break;
	              case "float":
	                gl.uniform1f(uniform.location, value);
	            }
	          }
	
	          gl.drawArrays(gl.TRIANGLES, 0, numTris * 3);
	
	          for (var _i10 = 0; _i10 < shader.attributes.length; _i10++) {
	            gl.disableVertexAttribArray(shader.attributes[_i10].location);
	          }
	
	          bp = 0;
	          numTris = 0;
	        }
	      };
	
	      return self;
	    }
	  };
	  return render;
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
	  getURL: function getURL(file) {
	    var attempt = function attempt(i) {
	      try {
	        return fileProviders[i].getURL(file);
	      } catch (error) {
	        if (i < fileProviders.length - 1) {
	          return attempt(i + 1);
	        } else {
	          throw error;
	        }
	      }
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
	      var loadingQueue = [];
	      for (var i = 0; i < json.length; i++) {
	        var spec = json[i];
	        loadingQueue.push(placeholders[spec.id] = AssetPlaceholder(spec));
	      }
	
	      var promises = [];
	
	      var _loop2 = function _loop2(_i) {
	        var placeholder = loadingQueue[_i];
	
	        var foundLoader = false;
	        for (var j = 0; j < assetLoaders.length; j++) {
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
	    return fetch("assets/" + name.replace(" ", "%20")).then(function (response) {
	      if (!response.ok) {
	        throw "HTTP " + response.status + " " + response.statusText + " while downloading assets/" + name.replace(" ", "%20");
	      }
	      return response.blob();
	    });
	  },
	  getURL: function getURL(file) {
	    return "assets/" + file;
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
	
	
	      load: {
	        identity: function identity() {
	          self.load.from(Mat4.identity);
	        },
	        from: function from(src) {
	          for (var i = 0; i < 4; i++) {
	            for (var j = 0; j < 4; j++) {
	              self.val[i][j] = src.val[i][j];
	            }
	          }
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
	
	var Mat4Stack = exports.Mat4Stack = {
	  create: function create() {
	    var stack = [];
	    for (var i = 0; i < 16; i++) {
	      stack[i] = Mat4.create();
	    }
	
	    var head = 0;
	
	    var self = {
	      reset: function reset() {
	        head = 0;
	      },
	      push: function push(matrix) {
	        if (head + 1 >= stack.length) {
	          stack[head + 1] = Mat4.create();
	        }
	        head++;
	        stack[head].load.from(matrix);
	      },
	      pop: function pop(matrix) {
	        matrix.load.from(stack[head--]);
	      },
	      peek: function peek(matrix) {
	        matrix.load.from(stack[head]);
	      }
	    };
	
	    return self;
	  }
	};
	
	var MatrixTransformer = exports.MatrixTransformer = {
	  create: function create() {
	    var matrix = void 0;
	
	    var apply = function apply(x, y, z, c) {
	      return matrix.val[0][c] * x + matrix.val[1][c] * y + matrix.val[2][c] * z + matrix.val[3][c] * 1;
	    };
	
	    var self = {
	      x: function x(_x, y, z) {
	        return apply(_x, y, z, 0);
	      },
	      y: function y(x, _y, z) {
	        return apply(x, _y, z, 1);
	      },
	      z: function z(x, y, _z) {
	        return apply(x, y, _z, 2);
	      },
	      into: function into(params, i, x, y, z) {
	        params[i++] = apply(x, y, z, 0);
	        params[i++] = apply(x, y, z, 1);
	        params[i++] = apply(x, y, z, 2);
	        return i;
	      },
	      useMatrix: function useMatrix(mat) {
	        matrix = mat;
	      }
	    };
	
	    return self;
	  }
	};

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
	  if (typeof r == "string") {
	    return {
	      r: parseInt(r.slice(1, 3), 16) / 255.0,
	      g: parseInt(r.slice(3, 5), 16) / 255.0,
	      b: parseInt(r.slice(5, 7), 16) / 255.0,
	      a: r.length == 7 ? 1 : parseInt(r.slice(7, 9)) / 255.0
	    };
	  }
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
	
	var ColorUtils = exports.ColorUtils = {
	  multRGB: function multRGB(color, fac) {
	    color.r *= fac;
	    color.g *= fac;
	    color.b *= fac;
	    return color;
	  }
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
	
	var _transitions = __webpack_require__(12);
	
	var _menu = __webpack_require__(13);
	
	var LoaderState = exports.LoaderState = function LoaderState(game) {
	  var render = game.render;
	  var color = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"), render.pixelMatrix);
	  var smallfont = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.coders_crux"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"), render.pixelMatrix);
	  var rects = render.createShapeDrawer();
	  var opMatrix = _math.Mat4.create();
	  var matrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	
	  var time = 0;
	
	  var backgroundColor = (0, _gfxutils.Color)("#422D24");
	  var foregroundColor = (0, _gfxutils.Color)("#241711");
	
	  var transition = (0, _transitions.DiamondTransition)(game, "left");
	
	  var error = void 0;
	  var errored = false;
	
	  return {
	    initialize: function initialize() {
	      Promise.all([_assetmgr.AssetManager.downloadAssetGroup("sfxtest"), _assetmgr.AssetManager.downloadAssetGroup("mustest"), _assetmgr.AssetManager.downloadAssetGroup("posttest"), _assetmgr.AssetManager.downloadAssetGroup("posttest2")]).then(function () {
	        transition.to((0, _menu.MenuState)(game, transition), 500, 100);
	      }, function (err) {
	        console.log("failed to load assets: " + err);
	        errored = true;
	        error = err;
	      });
	    },
	    tick: function tick(delta) {
	      render.clear(backgroundColor);
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      //rects.useMatrix(matrix);
	      //rects.useMaterial(color);
	      //rects.flush();
	
	      opMatrix.load.translate(render.width() / 2, render.height() / 2, 0);
	      matrix.multiply(opMatrix);
	
	      opMatrix.load.translate(render.width() % 2 / 2, render.height() % 2 / 2, 0); //pixel aign
	      matrix.multiply(opMatrix);
	
	      font.useMatrix(matrix);
	      smallfont.useMatrix(matrix);
	      if (!errored) {
	        font.drawCentered(foregroundColor, 0, -318, "Downloading Resources...");
	      } else {
	        font.drawCentered(foregroundColor, 0, -318, "Error While Downloading Assets:");
	        smallfont.drawCentered(foregroundColor, 0, -316 + font.height, error);
	        smallfont.flush();
	      }
	      font.flush();
	
	      transition.draw(delta);
	    }
	  };
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.DiamondTransition = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var DiamondTransition = exports.DiamondTransition = function DiamondTransition(game, dir) {
	  var render = game.render;
	
	  var time = 0;
	  var target = 0;
	  var state = void 0;
	  var pause = void 0;
	
	  var material = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelCenteredMatrix
	  });
	
	  var switched = false;
	
	  var self = {
	    to: function to(state2, duration, pause2) {
	      time = 0;
	      target = duration;
	      state = state2;
	      pause = pause2;
	      switched = false;
	    },
	    draw: function draw(delta) {
	      if (target <= 0) {
	        return;
	      }
	      time += delta;
	      if (time > target && !switched) {
	        switched = true;
	        game.switchState(state);
	      }
	
	      var progress = time / target;
	
	      if (progress < 2) {
	        var params = [];
	        var color = _gfxutils.Colors.BLACK;
	
	        var size = 20;
	
	        var _dir = progress < 1 ? 1 : -1;
	
	        var pg = progress;
	
	        if (progress > 1) {
	          if (pause > 0) {
	            pause -= delta;
	            time -= delta;
	            progress = 1;
	          }
	          pg = 1 - (progress - 1);
	        }
	
	        for (var x = -render.width() / 2; x <= render.width() / 2 + size; x += size * 2) {
	          for (var y = -render.height() / 2; y <= render.height() / 2 + size; y += size * 2) {
	            var i = 0;
	            var sz = size * (pg * 3 - _dir * (x / render.width()) - 0.5);
	
	            if (sz > 0) {
	              params[i++] = color;
	
	              params[i++] = x - sz;
	              params[i++] = y;
	              params[i++] = 0;
	
	              params[i++] = x;
	              params[i++] = y - sz;
	              params[i++] = 0;
	
	              params[i++] = x;
	              params[i++] = y + sz;
	              params[i++] = 0;
	
	              params[i++] = x + sz;
	              params[i++] = y;
	              params[i++] = 0;
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

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MenuState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var _keyboard2 = __webpack_require__(15);
	
	var _sound = __webpack_require__(16);
	
	var _music = __webpack_require__(17);
	
	var _stencil = __webpack_require__(18);
	
	var _post = __webpack_require__(19);
	
	var _post2 = __webpack_require__(20);
	
	var _about = __webpack_require__(21);
	
	var MenuState = exports.MenuState = function MenuState(game, transition) {
	  var render = game.render;
	  var color = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var rects = render.createShapeDrawer();
	  var opMatrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	  var time = 0;
	  var unifTimer = 0;
	
	  var gridA = (0, _gfxutils.Color)(0.020, 0.020, 0.020, 1);
	  var gridB = (0, _gfxutils.Color)(0.030, 0.030, 0.030, 1);
	
	  var shake = 0;
	  var tests = void 0;
	  var selectedTest = 0;
	
	  var kb = _keyboard.Keyboard.create();
	  var up = kb.createKeybind("ArrowUp", "w");
	  var down = kb.createKeybind("ArrowDown", "s");
	  var select = kb.createKeybind("Enter", "z", "Return");
	
	  var selected = false;
	
	  var self = {
	    initialize: function initialize() {
	      selected = false;
	      tests = [{
	        name: "Me & My Tools",
	        state: (0, _about.AboutState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Keyboard Test",
	        state: (0, _keyboard2.KeyboardTestState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Sound Test",
	        state: (0, _sound.SoundTestState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Music Test",
	        state: (0, _music.MusicTestState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Stencil Test",
	        state: (0, _stencil.StencilTestState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Post-Processing Test",
	        state: (0, _post.PostProcessingTestState)(game, self, transition),
	        anim: 0
	      }, {
	        name: "Post-Processing Test 2",
	        state: (0, _post2.PostProcessingTest2State)(game, self, transition),
	        anim: 0
	      }];
	    },
	    uniformTick: function uniformTick() {
	      shake = shake * 0.95;
	
	      for (var i = 0; i < tests.length; i++) {
	        if (i != selectedTest) {
	          tests[i].anim *= 0.90;
	        }
	      }
	    },
	    tick: function tick(delta) {
	      render.clear(_gfxutils.Colors.BLACK);
	
	      if (down.justPressed()) {
	        selectedTest++;
	        if (selectedTest >= tests.length) {
	          selectedTest = 0;
	        }
	      }
	
	      if (up.justPressed()) {
	        selectedTest--;
	        if (selectedTest < 0) {
	          selectedTest = tests.length - 1;
	        }
	      }
	
	      if (select.justPressed()) {
	        if (selected === false) {
	          selected = selectedTest;
	          transition.to(tests[selected].state, 750, 500);
	        }
	      }
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      opMatrix.load.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake, 0);
	      matrix.multiply(opMatrix);
	      matStack.push(matrix);
	
	      rects.useMatrix(matrix);
	      rects.useMaterial(color);
	      for (var x = 0; x < render.width(); x += 20) {
	        for (var y = 0; y < render.height(); y += 20) {
	          rects.drawColoredRect((x + y) % 40 == 0 ? gridA : gridB, x, y, x + 20, y + 20);
	        }
	      }
	      rects.flush();
	
	      matStack.peek(matrix);
	      opMatrix.load.translate(render.width() / 2, render.height() / 2, 0);
	      matrix.multiply(opMatrix);
	      matStack.push(matrix);
	
	      opMatrix.load.translate(0, -150, 0);
	      matrix.multiply(opMatrix);
	
	      opMatrix.load.rotate(Math.sin(time / 150.0) / 6);
	      matrix.multiply(opMatrix);
	
	      font.useMatrix(matrix);
	      font.drawCentered(_gfxutils.Colors.WHITE, 0, -font.height / 2, "LD36 Engine Test");
	      font.flush();
	
	      matStack.pop(matrix);
	
	      for (var i = 0; i < tests.length; i++) {
	        var test = tests[i];
	        if (i == selectedTest) {
	          test.anim = 1;
	        }
	        matStack.push(matrix);
	        opMatrix.load.scale((Math.sin(time / 150.0) + 4) / 10 * test.anim + 1, (Math.sin(time / 150.0) + 4) / 10 * test.anim + 1, (Math.sin(time / 150.0) + 4) / 10 * test.anim + 1);
	        matrix.multiply(opMatrix);
	
	        font.drawCentered(_gfxutils.Colors.WHITE, 0, -font.height / 2, tests[i].name);
	
	        matStack.pop(matrix);
	
	        opMatrix.load.translate(0, font.height, 0);
	        matrix.multiply(opMatrix);
	      }
	
	      transition.draw(delta);
	      time += delta;
	      unifTimer += delta;
	      while (unifTimer > 10) {
	        unifTimer -= 10;
	        self.uniformTick();
	      }
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	  return self;
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var Keyboard = exports.Keyboard = {
	  create: function create() {
	    var bindMap = {};
	    var bindings = [];
	
	    var self = {
	      createKeybind: function createKeybind() {
	        var lastState = false;
	        var state = false;
	
	        var pressCBs = [];
	        var releaseCBs = [];
	
	        var bind = {
	          press: function press() {
	            state = true;
	          },
	          release: function release() {
	            state = false;
	          },
	          justPressed: function justPressed() {
	            return state && !lastState;
	          },
	          justReleased: function justReleased() {
	            return !state && lastState;
	          },
	          isPressed: function isPressed() {
	            return state;
	          },
	          update: function update() {
	            if (bind.justPressed()) {
	              for (var i = 0; i < pressCBs.length; i++) {
	                pressCBs[i]();
	              }
	            }
	            if (bind.justReleased()) {
	              for (var _i = 0; _i < releaseCBs.length; _i++) {
	                releaseCBs[_i]();
	              }
	            }
	
	            lastState = state;
	          },
	          addPressCallback: function addPressCallback(cb) {
	            pressCBs.push(cb);
	          },
	          addReleaseCallback: function addReleaseCallback(cb) {
	            releaseCBs.push(cb);
	          }
	        };
	
	        for (var i = 0; i < arguments.length; i++) {
	          if (!bindMap[arguments[i]]) {
	            bindMap[arguments[i]] = [];
	          }
	          bindMap[arguments[i]].push(bind);
	        }
	
	        bindings.push(bind);
	
	        return bind;
	      },
	      update: function update() {
	        for (var i = 0; i < bindings.length; i++) {
	          bindings[i].update();
	        }
	      },
	      keyDown: function keyDown(evt) {
	        if (bindMap[evt.key]) {
	          for (var i = 0; i < bindMap[evt.key].length; i++) {
	            bindMap[evt.key][i].press();
	          }
	        }
	      },
	      keyUp: function keyUp(evt) {
	        if (bindMap[evt.key]) {
	          for (var i = 0; i < bindMap[evt.key].length; i++) {
	            bindMap[evt.key][i].release();
	          }
	        }
	      }
	    };
	
	    return self;
	  }
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.KeyboardTestState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1),
	  arrowOutline: (0, _gfxutils.Color)(0.8, 0.8, 1, 1),
	  pressed: (0, _gfxutils.Color)(1, 1, 1, 1),
	  debug: _gfxutils.Colors.RED
	};
	
	var KeyboardTestState = exports.KeyboardTestState = function KeyboardTestState(game, menu, transition) {
	  var render = game.render;
	  var shapesMaterial = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var shapes = render.createShapeDrawer();
	
	  var opMatrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	  var time = 0;
	  var unifTimer = 0;
	  var shake = 0;
	  var kb = _keyboard.Keyboard.create();
	
	  var binds = [kb.createKeybind("ArrowLeft", "a"), kb.createKeybind("ArrowUp", "w"), kb.createKeybind("ArrowDown", "s"), kb.createKeybind("ArrowRight", "d")];
	
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  for (var i = 0; i < binds.length; i++) {
	    binds[i].addPressCallback(function () {
	      shake = 10;
	    });
	  }
	
	  var self = {
	    drawLeftArrow: function drawLeftArrow(hollow) {
	      matStack.push(matrix);
	      opMatrix.load.rotate(-Math.PI / 2);
	      matrix.multiply(opMatrix);
	      self.drawUpArrow(hollow);
	      matStack.pop(matrix);
	    },
	    drawUpArrow: function drawUpArrow(hollow) {
	      shapes.drawColoredRect(colors.arrowOutline, -10, -10, 10, 20);
	      shapes.drawColoredTriangle(colors.arrowOutline, -20, 0, 0, -20, 20, 0);
	
	      if (hollow) {
	        shapes.drawColoredRect(hollow, -8, -2, 8, 18);
	        shapes.drawColoredTriangle(hollow, -16, -2, 0, -16, 16, -2);
	      }
	    },
	    drawDownArrow: function drawDownArrow(hollow) {
	      matStack.push(matrix);
	      opMatrix.load.rotate(Math.PI);
	      matrix.multiply(opMatrix);
	      self.drawUpArrow(hollow);
	      matStack.pop(matrix);
	    },
	    drawRightArrow: function drawRightArrow(hollow) {
	      matStack.push(matrix);
	      opMatrix.load.rotate(Math.PI / 2);
	      matrix.multiply(opMatrix);
	      self.drawUpArrow(hollow);
	      matStack.pop(matrix);
	    },
	    uniformTick: function uniformTick() {
	      shake *= 0.95;
	    },
	    tick: function tick(delta) {
	      render.clear(colors.bg);
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      shapes.useMatrix(matrix);
	      shapes.useMaterial(shapesMaterial);
	
	      opMatrix.load.translate(render.width() / 2, render.height() / 2, 0);
	      matrix.multiply(opMatrix);
	      matStack.push(matrix);
	
	      opMatrix.load.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake, 0);
	      matrix.multiply(opMatrix);
	      matStack.push(matrix);
	
	      opMatrix.load.translate(-75, 0, 0);
	      matrix.multiply(opMatrix);
	
	      var symbols = [self.drawLeftArrow, self.drawUpArrow, self.drawDownArrow, self.drawRightArrow];
	      for (var _i = 0; _i < symbols.length; _i++) {
	        symbols[_i](binds[_i].isPressed() ? colors.pressed : colors.bg);
	
	        opMatrix.load.translate(50, 0, 0);
	        matrix.multiply(opMatrix);
	      }
	
	      unifTimer += delta;
	      while (unifTimer > 10) {
	        unifTimer -= 10;
	        self.uniformTick();
	      }
	
	      shapes.flush();
	
	      matrix.load.identity();
	      font.useMatrix(matrix);
	      font.draw(_gfxutils.Colors.WHITE, 0, render.height() - font.height, "Press Escape to go back");
	      font.flush();
	
	      transition.draw(delta);
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	
	  return self;
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SoundTestState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1)
	};
	
	var SoundTestState = exports.SoundTestState = function SoundTestState(game, menu, transition) {
	  var render = game.render;
	  var sfx = game.sound;
	
	  var soundMap = {
	    "a": "sfxtest.krab",
	    "s": "sfxtest.krabs",
	    "d": "sfxtest.mr",
	    "f": "sfxtest.oh",
	    "g": "sfxtest.yeah"
	  };
	
	  var kb = _keyboard.Keyboard.create();
	
	  var _loop = function _loop(key) {
	    var asset = _assetmgr.AssetManager.getAsset(soundMap[key]);
	
	    kb.createKeybind(key).addPressCallback(function () {
	      sfx.playSound(asset);
	    });
	  };
	
	  for (var key in soundMap) {
	    _loop(key);
	  }
	
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	  var opMatrix = _math.Mat4.create();
	
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  var self = {
	    initialize: function initialize() {},
	    tick: function tick(delta) {
	      render.clear(colors.bg);
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      font.useMatrix(matrix);
	      font.draw(_gfxutils.Colors.WHITE, 0, render.height() - font.height, "Press Escape to go back");
	      font.draw(_gfxutils.Colors.WHITE, 0, 0, "Try ASDFG. Be careful, though, because it's loud!");
	      font.flush();
	
	      transition.draw(delta);
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	
	  return self;
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MusicTestState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1),
	  point: (0, _gfxutils.Color)(0.8, 0.8, 1, 1)
	};
	
	var MusicTestState = exports.MusicTestState = function MusicTestState(game, menu, transition) {
	  var render = game.render;
	  var sfx = game.sound;
	
	  var color = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var shapes = render.createShapeDrawer();
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.coders_crux"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var bigfont = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	  var opMatrix = _math.Mat4.create();
	
	  var points = {
	    harmony: [50, 50],
	    bass: [600, 60],
	    ride: [300, 300],
	    beat: [50, 600],
	    melody: [600, 600],
	    arpeggio: [300, 50]
	  };
	
	  var music = void 0;
	
	  var kb = _keyboard.Keyboard.create();
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  var self = {
	    initialize: function initialize() {
	      music = sfx.playMusic(_assetmgr.AssetManager.getAsset("mustest.music"));
	    },
	    tick: function tick(delta) {
	      render.clear(colors.bg);
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      font.useMatrix(matrix);
	      shapes.useMatrix(matrix);
	      shapes.useMaterial(color);
	      for (var name in points) {
	        var pt = points[name];
	
	        shapes.drawColoredRect(colors.point, pt[0] - 5, pt[1] - 5, pt[0] + 5, pt[1] + 5);
	        font.draw(colors.point, pt[0] + 7, pt[1] - font.height - 7, name);
	
	        music.setTrackVolume(name, 1 - Math.min(Math.max(Math.sqrt(Math.pow(game.mouse.x - pt[0], 2) + Math.pow(game.mouse.y - pt[1], 2)) / 700.0, 0), 1));
	      }
	
	      font.draw(colors.point, 0, 0, "(" + game.mouse.x + ", " + game.mouse.y + ")");
	
	      shapes.flush();
	      font.flush();
	
	      bigfont.useMatrix(matrix);
	      bigfont.draw(_gfxutils.Colors.WHITE, 0, render.height() - bigfont.height, "Press Escape to go back");
	      bigfont.flush();
	
	      music.update();
	
	      transition.draw(delta);
	    },
	    destroy: function destroy() {
	      music.stop();
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	
	  return self;
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.StencilTestState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1),
	  fg: (0, _gfxutils.Color)(0.8, 0.8, 1, 1),
	  water: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(0.8, 0.8, 1, 1), 0.2),
	  stars: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(1, 0.8, 0.8, 1), 0.2)
	};
	
	var StencilTestState = exports.StencilTestState = function StencilTestState(game, menu, transition) {
	  var render = game.render;
	  var shapesMaterial = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var shapes = render.createShapeDrawer();
	
	  var opMatrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	
	  var kb = _keyboard.Keyboard.create();
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  var stars = [];
	  for (var i = 0; i < 1000; i++) {
	    stars.push([Math.random(), Math.random()]);
	  }
	
	  var self = {
	    initialize: function initialize() {},
	    drawScene: function drawScene() {
	      for (var _i = 0; _i < stars.length; _i++) {
	        var star = stars[_i];
	        shapes.drawColoredRect(colors.stars, render.width() * star[0] - 1.0, render.height() * star[1] - 1.0, render.width() * star[0] + 1.0, render.height() * star[1] + 1.0);
	      }
	
	      shapes.drawColoredRect(colors.fg, 0, render.height() / 2, render.width() / 2 - 100, render.height());
	      shapes.drawColoredRect(colors.fg, render.width() / 2 + 100, render.height() / 2, render.width(), render.height());
	      shapes.drawColoredRect(colors.fg, game.mouse.x - 5, game.mouse.y - 5, game.mouse.x + 5, game.mouse.y + 5);
	    },
	    reflect: function reflect(y) {
	      opMatrix.load.translate(0, y * 2, 0);matrix.multiply(opMatrix);
	      opMatrix.load.scale(1, -1, 1);matrix.multiply(opMatrix);
	    },
	    tick: function tick(delta) {
	      render.clear(colors.bg);
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      shapes.useMatrix(matrix);
	      shapes.useMaterial(shapesMaterial);
	
	      self.drawScene();
	      shapes.flush();
	
	      render.setStencil(true);
	      render.drawStencil();
	      shapes.drawColoredRect(_gfxutils.Colors.WHITE, 0, render.height() / 2 + 100, render.width(), render.height()); // really doesn't matter what color, cause we can't see this
	      shapes.flush();
	      render.drawColor();
	
	      self.reflect(render.height() / 2 + 100);
	      shapes.drawColoredRect(colors.bg, 0, 0, render.width(), render.height()); //clear
	      self.drawScene();
	      shapes.flush();
	      render.setStencil(false);
	
	      matStack.pop(matrix);
	      font.useMatrix(matrix);
	      font.draw(_gfxutils.Colors.WHITE, 0, render.height() - font.height, "Press Escape to go back");
	      font.flush();
	
	      transition.draw(delta);
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	  return self;
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.PostProcessingTestState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1),
	  fg: (0, _gfxutils.Color)(0.8, 0.8, 1, 1),
	  water: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(0.8, 0.8, 1, 1), 0.2),
	  stars: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(1, 0.8, 0.8, 1), 0.2)
	};
	
	var PostProcessingTestState = exports.PostProcessingTestState = function PostProcessingTestState(game, menu, transition) {
	  var render = game.render;
	  var shapesMaterial = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var fb = render.createFramebuffer(100); // 100 pixels of padding
	  var _time = 0;
	  var _rippleX = 0;
	  var _rippleY = 0;
	  var post = render.createMaterial(_assetmgr.AssetManager.getAsset("posttest.shader"), {
	    framebuffer: fb.getTexture(),
	    matrix: render.pixelMatrix,
	    time: function time() {
	      return _time;
	    },
	    pixwidth: function pixwidth() {
	      return render.fbwidth();
	    },
	    pixheight: function pixheight() {
	      return render.fbheight();
	    },
	    rippleX: function rippleX() {
	      return _rippleX;
	    },
	    rippleY: function rippleY() {
	      return _rippleY;
	    }
	  });
	  var shapes = render.createShapeDrawer();
	
	  var opMatrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	
	  var kb = _keyboard.Keyboard.create();
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	  kb.createKeybind("z").addPressCallback(function () {
	    _time = 0;
	    _rippleX = fb.xtoc(game.mouse.x);
	    _rippleY = fb.ytoc(game.mouse.y);
	  });
	
	  var stars = [];
	  for (var i = 0; i < 1000; i++) {
	    stars.push([Math.random(), Math.random()]);
	  }
	
	  var self = {
	    initialize: function initialize() {},
	    drawScene: function drawScene() {
	      for (var _i = 0; _i < stars.length; _i++) {
	        var star = stars[_i];
	        shapes.drawColoredRect(colors.stars, render.fbwidth() * star[0] - 1.0, render.fbheight() * star[1] - 1.0, render.fbwidth() * star[0] + 1.0, render.fbheight() * star[1] + 1.0);
	      }
	
	      shapes.drawColoredRect(colors.fg, 0, render.fbheight() / 2, render.fbwidth() / 2 - 100, render.fbheight());
	      shapes.drawColoredRect(colors.fg, render.fbwidth() / 2 + 100, render.fbheight() / 2, render.fbwidth(), render.fbheight());
	      shapes.drawColoredRect(colors.fg, game.mouse.x - 5, game.mouse.y - 5, game.mouse.x + 5, game.mouse.y + 5);
	    },
	    reflect: function reflect(y) {
	      opMatrix.load.translate(0, y * 2, 0);matrix.multiply(opMatrix);
	      opMatrix.load.scale(1, -1, 1);matrix.multiply(opMatrix);
	    },
	    tick: function tick(delta) {
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      shapes.useMatrix(matrix);
	      shapes.useMaterial(shapesMaterial);
	
	      fb.bind();
	      render.clear(colors.bg);
	      self.drawScene();
	      shapes.flush();
	      font.useMatrix(matrix);
	      font.draw(colors.bg, 0, render.height() - font.height, "Press Escape to go back");
	      font.draw(colors.bg, 0, render.height() - 2 * font.height, "Try moving the mouse and tapping Z");
	      font.flush();
	
	      fb.unbind();
	
	      render.clear(_gfxutils.Colors.RED);
	      post.drawQuad(fb.getAttributes());
	      post.flush();
	
	      transition.draw(delta);
	      _time += delta;
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	  return self;
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.PostProcessingTest2State = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1),
	  fg: (0, _gfxutils.Color)(0.8, 0.8, 1, 1),
	  water: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(0.8, 0.8, 1, 1), 0.2),
	  stars: _gfxutils.ColorUtils.multRGB((0, _gfxutils.Color)(1, 0.8, 0.8, 1), 0.2)
	};
	
	var PostProcessingTest2State = exports.PostProcessingTest2State = function PostProcessingTest2State(game, menu, transition) {
	  var render = game.render;
	  var shapesMaterial = render.createMaterial(_assetmgr.AssetManager.getAsset("base.shader.flat.color"), {
	    matrix: render.pixelMatrix
	  });
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	  var fb = render.createFramebuffer(100); // 100 pixels of padding
	  var _time = 0;
	  var postMatrix = _math.Mat4.create();
	  var post = render.createMaterial(_assetmgr.AssetManager.getAsset("posttest2.shader"), {
	    framebuffer: fb.getTexture(),
	    perlin: _assetmgr.AssetManager.getAsset("posttest2.perlin"),
	    matrix: postMatrix,
	    time: function time() {
	      return _time;
	    },
	    pixwidth: function pixwidth() {
	      return render.fbwidth();
	    },
	    pixheight: function pixheight() {
	      return render.fbheight();
	    }
	  });
	  var shapes = render.createShapeDrawer();
	
	  var opMatrix = _math.Mat4.create();
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	
	  var kb = _keyboard.Keyboard.create();
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  var stars = [];
	  for (var i = 0; i < 1000; i++) {
	    stars.push([Math.random(), Math.random()]);
	  }
	
	  var self = {
	    initialize: function initialize() {},
	    drawScene: function drawScene() {
	      for (var _i = 0; _i < stars.length; _i++) {
	        var star = stars[_i];
	        shapes.drawColoredRect(colors.stars, render.width() * star[0] - 1.0, render.height() * star[1] - 1.0, render.width() * star[0] + 1.0, render.height() * star[1] + 1.0);
	      }
	
	      shapes.drawColoredRect(colors.fg, 0, render.height() / 2, render.width() / 2 - 100, render.height());
	      shapes.drawColoredRect(colors.fg, render.width() / 2 + 100, render.height() / 2, render.width(), render.height());
	      shapes.drawColoredRect(colors.fg, game.mouse.x - 5, game.mouse.y - 5, game.mouse.x + 5, game.mouse.y + 5);
	    },
	    reflect: function reflect(y, matrix) {
	      opMatrix.load.translate(0, y * 2, 0);matrix.multiply(opMatrix);
	      opMatrix.load.scale(1, -1, 1);matrix.multiply(opMatrix);
	    },
	    tick: function tick(delta) {
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      shapes.useMatrix(matrix);
	      shapes.useMaterial(shapesMaterial);
	
	      fb.bind();
	      render.clear(colors.bg);
	      self.drawScene();
	      shapes.flush();
	      fb.unbind();
	
	      render.clear(colors.bg);
	      self.drawScene();
	      shapes.flush();
	
	      render.setStencil(true);
	      render.drawStencil();
	      shapes.drawColoredRect(_gfxutils.Colors.WHITE, 0, render.height() / 2 + 100, render.width(), render.height());
	      shapes.flush();
	      render.drawColor();
	
	      postMatrix.load.from(render.pixelMatrix);
	      self.reflect(render.height() / 2 + 100, postMatrix);
	      post.drawQuad(fb.getAttributes());
	      post.flush();
	      render.setStencil(false);
	
	      font.useMatrix(matrix);
	      font.draw(colors.bg, 0, render.height() - font.height, "Press Escape to go back");
	      font.flush();
	
	      transition.draw(delta);
	      _time += delta;
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	  return self;
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.AboutState = undefined;
	
	var _assetmgr = __webpack_require__(7);
	
	var _gfxutils = __webpack_require__(10);
	
	var _math = __webpack_require__(8);
	
	var _keyboard = __webpack_require__(14);
	
	var colors = {
	  bg: (0, _gfxutils.Color)(0.02, 0.02, 0.02, 1)
	};
	
	var AboutState = exports.AboutState = function AboutState(game, menu, transition) {
	  var render = game.render;
	  var sfx = game.sound;
	
	  var matStack = _math.Mat4Stack.create();
	  var matrix = _math.Mat4.create();
	  var opMatrix = _math.Mat4.create();
	
	  var font = render.createFontRenderer(_assetmgr.AssetManager.getAsset("base.font.open_sans"), _assetmgr.AssetManager.getAsset("base.shader.flat.texcolor"));
	
	  var kb = _keyboard.Keyboard.create();
	  kb.createKeybind("Escape").addPressCallback(function () {
	    transition.to(menu, 750, 500);
	  });
	
	  var self = {
	    initialize: function initialize() {},
	    tick: function tick(delta) {
	      render.clear(colors.bg);
	
	      matStack.reset();
	      matrix.load.identity();
	      matStack.push(matrix);
	
	      font.useMatrix(matrix);
	      font.draw(_gfxutils.Colors.WHITE, 0, render.height() - font.height, "Press Escape to go back");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 0, "Hey, I'm misson20000!");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 1, "This is my custom engine I'll be using for Ludum Dare 36.");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 2, "The Tools:");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 3, "- Text Editor: emacs");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 4, "- Language: EcmaScript 6 (emacs script :D)");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 5, "- Transpiler: Babel");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 6, "- Umm... webpacker: webpack");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 7, "- Music: LMMS");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 8, "- Images: GIMP");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 9, "- Browser: Mozilla Firefox Developer Edition");
	      font.draw(_gfxutils.Colors.WHITE, 0, font.height * 10, "- Linux Distro: Arch Linux");
	      font.flush();
	
	      transition.draw(delta);
	    },
	    getKeyboard: function getKeyboard() {
	      return kb;
	    }
	  };
	  return self;
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SoundEngine = undefined;
	
	var _blobUtil = __webpack_require__(2);
	
	var BlobUtil = _interopRequireWildcard(_blobUtil);
	
	var _assetmgr = __webpack_require__(7);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var SoundEngine = exports.SoundEngine = function SoundEngine(game) {
	  var ctx = new AudioContext();
	
	  var sfx = {
	    createAssetLoader: function createAssetLoader() {
	      var loaders = {
	        "sound": function sound(placeholder) {
	          return _assetmgr.AssetManager.getFile(placeholder.spec.src).then(function (blob) {
	            return BlobUtil.blobToArrayBuffer(blob);
	          }).then(function (ab) {
	            return ctx.decodeAudioData(ab);
	          }).then(function (audio) {
	            return audio;
	          });
	        },
	        "music": function music(placeholder) {
	          var tracks = {};
	          var promises = [];
	
	          var _loop = function _loop(name) {
	            var track = placeholder.spec.tracks[name];
	            tracks[name] = [];
	
	            var _loop2 = function _loop2(i) {
	              var media = new Audio();
	              media.loop = true;
	              tracks[name].push(media);
	              promises.push(new Promise(function (resolve, reject) {
	                //pre-buffer enough of the track
	                media.oncanplaythrough = resolve;
	                media.onerror = function () {
	                  reject(["!?!?!", "MEDIA_ERR_ABORTED", "MEDIA_ERR_NETWORK", "MEDIA_ERR_DECODE", "MEDIA_ERR_SRC_NOT_SUPPORTED"][media.error.code] + " on track '" + name + "', source " + i + " (" + track[i] + " -> " + _assetmgr.AssetManager.getURL(track[i]) + ")");
	                };
	                media.src = _assetmgr.AssetManager.getURL(track[i]);
	              }));
	            };
	
	            for (var i = 0; i < track.length; i++) {
	              _loop2(i);
	            }
	          };
	
	          for (var name in placeholder.spec.tracks) {
	            _loop(name);
	          }
	
	          return Promise.all(promises).then(function () {
	            return tracks;
	          });
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
	    playSound: function playSound(buffer) {
	      var source = ctx.createBufferSource();
	      source.buffer = buffer;
	      source.connect(ctx.destination);
	      source.start(0);
	    },
	    playMusic: function playMusic(asset) {
	      var tracks = {};
	      var sources = [];
	      for (var _track in asset) {
	        var gain = ctx.createGain();
	        for (var i = 0; i < asset[_track].length; i++) {
	          var src = ctx.createMediaElementSource(asset[_track][i]);
	          src.connect(gain);
	          asset[_track][i].currentTime = 0;
	          asset[_track][i].play();
	          sources.push(asset[_track][i]);
	        }
	        gain.gain.value = 1;
	        gain.connect(ctx.destination);
	        tracks[_track] = gain;
	      }
	
	      var music = {
	        update: function update() {},
	        setTrackVolume: function setTrackVolume(name, gain) {
	          tracks[name].gain.value = gain;
	        },
	        stop: function stop() {
	          for (var _i = 0; _i < sources.length; _i++) {
	            sources[_i].pause();
	          }
	        }
	      };
	      return music;
	    }
	  };
	
	  return sfx;
	};

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map