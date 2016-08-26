import * as BlobUtil from "blob-util";

import {AssetManager} from "./assetmgr.js";
import {Mat4, MatrixTransformer} from "./math.js";

export let WebGLRenderer = (game, canvas, gl) => {
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let workingMatrix = Mat4.create();
  
  let render = {
    manageSize() {
      if(canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
        
        if(game.state && game.state.updateSize) {
          game.state.updateSize(canvas.width, canvas.height);
        }
      }
    },

    initMatrices() {
      render.pixelMatrix.load.identity();
      render.pixelCenteredMatrix.load.identity();
      workingMatrix.load.scale(2/render.width(), -2/render.height(), 1); // scale down to pixels and flip
      render.pixelMatrix.multiply(workingMatrix);
      render.pixelCenteredMatrix.multiply(workingMatrix);
      workingMatrix.load.translate(-render.width()/2, -render.height()/2, 0);
      render.pixelMatrix.multiply(workingMatrix);
    },
    
    clear(color) {
      gl.clearColor(color.r, color.g, color.b, color.a);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },

    width() {
      return canvas.width;
    },
    height() {
      return canvas.height;
    },

    createAssetLoader() {
      let loaders = {
        "font": (placeholder) => {
          return AssetManager.getFile(placeholder.spec.xml).then((blob) => {
            return new Promise((resolve, reject) => {
              let xhr = new XMLHttpRequest();
              
              xhr.onload = () => {
                resolve(xhr.responseXML);
              };

              xhr.onerror = reject;
              
              xhr.responseType = "document";
              
              xhr.open("GET", URL.createObjectURL(blob));
              xhr.send();
            });
          }).then((doc) => {
            let root = doc.firstChild;
            if(root.nodeName != "Font") {
              throw "Bad font descriptor file (root element is <" + root.nodeName + ">)";
            }
            
            let font = {
              height: parseInt(root.getAttribute("height")),
              glyphs: {}
            };

            for(let i = 0; i < root.children.length; i++) {
              let ch = root.children[i];
              let glyph = {};

              let offset = ch.getAttribute("offset").split(" ");
              glyph.offsetx = parseInt(offset[0]);
              glyph.offsety = parseInt(offset[1]);

              let rect = ch.getAttribute("rect").split(" ").map((str) => {
                return parseInt(str);
              });
              glyph.rectx = rect[0];
              glyph.recty = rect[1];
              glyph.rectw = rect[2];
              glyph.recth = rect[3];

              glyph.width = parseInt(ch.getAttribute("width"));
              
              font.glyphs[ch.getAttribute("code")] = glyph;
            }
            return placeholder.depend(placeholder.spec.texture).then((tex) => {
              font.texture = tex;
              return font;
            });
          });
        },
        "texture": (placeholder) => {
          return AssetManager.getFile(placeholder.spec.src).then((blob) => {
            return new Promise((resolve, reject) => {
              let image = new Image();
              image.onload = () => {
                resolve(image);
              };
              image.onerror = (evt) => {
                reject(evt.type);
              };
              image.src = URL.createObjectURL(blob);
            });
          }).then((img) => {
            let texture = gl.createTexture();
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
        "shader": (placeholder) => {
          if(placeholder.spec.shadertype == "fragment" || placeholder.spec.shadertype == "vertex") {
            return AssetManager.getFile(placeholder.spec.src).then((blob) => {
              return BlobUtil.blobToBinaryString(blob);
            }).then((src) => {
              let shader = gl.createShader({fragment: gl.FRAGMENT_SHADER, vertex: gl.VERTEX_SHADER}[placeholder.spec.shadertype]);
              gl.shaderSource(shader, src);
              gl.compileShader(shader);
              if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                let log = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw "Could not compile shader: " + log;
              }

              return shader;
            });
          }
          if(placeholder.spec.shadertype == "program") {
            let promises = placeholder.spec.shaders.map((id) => {
              return placeholder.depend(id);
            });
            return Promise.all(promises).then((shaders) => {
              let program = gl.createProgram();
              for(let i = 0; i < shaders.length; i++) {
                gl.attachShader(program, shaders[i]);
              }
              gl.linkProgram(program);

              if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw "Could not link program: " + gl.getProgramInfoLog(program);
              }

              let runtime = {
                stride: 0,
                numComponents: 0
              };

              let attribOffset = 0;
              let attributes = placeholder.spec.attributes.map((attrib) => {
                let loc = gl.getAttribLocation(program, attrib.name);
                if(loc == -1) {
                  throw "Could not find attribute '" + attrib.name + "'";
                }
                runtime.stride+= attrib.components * 4; // 4 bytes / float
                runtime.numComponents+= attrib.components;
                
                attrib.location = loc;
                attrib.runtime = {};
                attrib.runtime.components = [];
                attrib.runtime.offset = attribOffset;
                attribOffset+= attrib.components * 4; // 4 bytes / float
                attrib.runtime.loadData = (args, i) => {
                  switch(attrib.datatype) {
                  case "color":
                    let arg = args[i++];
                    attrib.runtime.components[0] = arg.r;
                    attrib.runtime.components[1] = arg.g;
                    attrib.runtime.components[2] = arg.b;
                    break;
                  case "vec":
                    for(let j = 0; j < attrib.components; j++) {
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

              let uniforms = placeholder.spec.uniforms.map((uniform) => {
                let loc = gl.getUniformLocation(program, uniform.name);
                if(loc == -1) {
                  throw "Could not find uniform '" + uniform.name + "'";
                }
                
                uniform.location = loc;

                return uniform;
              });

              
              return {
                program,
                attributes,
                uniforms,
                runtime
              };
            });
          }
          throw "bad shadertype: " + placeholder.spec.shadertype
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

    createFontRenderer(font, shader) {
      let material = render.createMaterial(shader, {
        matrix: render.pixelMatrix,
        tex: font.texture
      });

      let rects = render.createShapeDrawer();
      rects.useMaterial(material);
      
      let self = {
        height: font.height,
        draw(color, x, y, string) {
          for(let i = 0; i < string.length; i++) {
            let glyph = font.glyphs[string[i]];

            rects.drawTexturedAndColoredRect(
              color,
              x + glyph.offsetx, y + glyph.offsety,
              x + glyph.offsetx + glyph.rectw, y + glyph.offsety + glyph.recth,
              glyph.rectx / font.texture.width,
              glyph.recty / font.texture.height,
              (glyph.rectx + glyph.rectw) / font.texture.width,
              (glyph.recty + glyph.recth) / font.texture.height);
            
            x+= glyph.width;
          }
        },
        useMatrix(mat) {
          rects.useMatrix(mat);
        },
        computeWidth(string) {
          let x = 0;
          
          for(let i = 0; i < string.length; i++) {
            let glyph = font.glyphs[string[i]];
            x+= glyph.width;
          }

          return x;
        },
        drawCentered(color, x, y, string) {
          self.draw(color, x - self.computeWidth(string)/2, y, string);
        },
        flush() {
          rects.flush();
        }
      };

      return self;
    },
    
    createShapeDrawer() { // trades flexibility for lack of allocations
      let params = []
      let material;
      let tform = MatrixTransformer.create();
      
      let self = {
        useMaterial(mat) {
          if(material) {
            material.flush();
          }
          material = mat
        },
        useMatrix(mat) {
          tform.useMatrix(mat);
        },
        drawColoredRect(color, x1, y1, x2, y2) {
          let i = 0;
          params[i++] = color;
          i = tform.into(params, i, x1, y1, 0);
          i = tform.into(params, i, x2, y1, 0);
          i = tform.into(params, i, x1, y2, 0);
          i = tform.into(params, i, x2, y2, 0);          
          material.drawQuad(params);
        },
        drawColoredTriangle(color, x1, y1, x2, y2, x3, y3) {
          let i = 0;
          params[i++] = color;
          i = tform.into(params, i, x1, y1, 0);
          i = tform.into(params, i, x2, y2, 0);
          i = tform.into(params, i, x3, y3, 0);
          material.drawTri(params);
        },
        drawTexturedRect(x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
          let i = 0;
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
        drawTexturedAndColoredRect(c, x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
          let i = 0;
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
        flush() {
          material.flush();
        }
      };
      return self;
    },

    pixelMatrix: Mat4.create(),
    pixelCenteredMatrix: Mat4.create(),
    
    createMaterial(shader, uniforms) {
      let triangles = 2048;
      
      let vertBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);

      let perVertex = [];
      let perShape = [];
      for(let i = 0; i < shader.attributes.length; i++) {
        let attrib = shader.attributes[i];

        switch(attrib.type) {
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
      
      let buffer = new Float32Array(triangles
                                    * 3 // 3 vertices per triangle
                                    * shader.runtime.numComponents);
      let bp = 0; // buffer pos
      let numTris = 0;
      
      gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);

      let bufferFromAttributes = () => {
        for(let i = 0; i < shader.attributes.length; i++) {
          let attrib = shader.attributes[i];
          for(let j = 0; j < attrib.components; j++) {
            buffer[bp++] = attrib.runtime.components[j];
          }
        }
      };
      
      let self = {
        drawQuad(args) {
          if(numTris + 2 > triangles) {
            self.flush();
          }
          
          let argI = 0;
          for(let i = 0; i < perShape.length; i++) {
            argI = perShape[i].runtime.loadData(args, argI);
          }
          
          for(let i = 0; i < perVertex.length; i++) {
            argI = perVertex[i].runtime.loadData(args, argI);
          }
          bufferFromAttributes();
          let tri2argI = argI;
          for(let h = 0; h < 2; h++) {
            for(let i = 0; i < perVertex.length; i++) {
              argI = perVertex[i].runtime.loadData(args, argI);
            }
            bufferFromAttributes();
          }
          argI = tri2argI; //rewind argument iterator to where it was after the first vertex was read
          for(let h = 0; h < 3; h++) {
            for(let i = 0; i < perVertex.length; i++) {
              argI = perVertex[i].runtime.loadData(args, argI);
            }
            bufferFromAttributes();
          }
          
          numTris+= 2;
        },

        drawTri(args) {
          if(numTris + 1 > triangles) {
            self.flush();
          }

          let argI = 0;
          for(let i = 0; i < perShape.length; i++) {
            argI = perShape[i].runtime.loadData(args, argI);
          }
          for(let i = 0; i < 3; i++) {
            for(let j = 0; j < perVertex.length; j++) {
              argI = perVertex[j].runtime.loadData(args, argI);
            }
            bufferFromAttributes();
          }

          numTris++;
        },

        flush: () => {
          gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer);

          gl.useProgram(shader.program);

          for(let i = 0; i < shader.attributes.length; i++) {
            let attrib = shader.attributes[i];
            gl.enableVertexAttribArray(attrib.location);
            gl.vertexAttribPointer(attrib.location,
                                   attrib.components,
                                   gl.FLOAT, false,
                                   shader.runtime.stride,
                                   attrib.runtime.offset);
          }

          for(let i = 0; i < shader.uniforms.length; i++) {
            let uniform = shader.uniforms[i];

            switch(shader.uniforms[i].datatype) {
            case "mat4":
              gl.uniformMatrix4fv(uniform.location, false, uniforms[uniform.name].toGL());
              break;
            case "tex2d":
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D, uniforms[uniform.name].glTex);
              gl.uniform1i(uniform.location, 0);
              break;
            }
          }
          
          gl.drawArrays(gl.TRIANGLES, 0, numTris * 3);

          for(let i = 0; i < shader.attributes.length; i++) {
            gl.disableVertexAttribArray(shader.attributes[i].location);
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
