export let Mat4 = {  
  create: () => {
    let multBuffer = [[],[],[],[]];

    let gl = new Float32Array(16);
    
    let self = {
      val: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ],      

      toGL() {
        for(let i = 0; i < 4; i++) {
          for(let j = 0; j < 4; j++) {
            gl[i * 4 + j] = self.val[i][j];
          }
        }

        return gl;
      },
      
      load: {
        identity() {
          self.load.from(Mat4.identity);
        },

        from(src) {
          for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 4; j++) {
              self.val[i][j] = src.val[i][j];
            }
          }
        },
        
        translate(x, y, z) {
          self.load.identity();
          self.val[3][0] = x;
          self.val[3][1] = y;
          self.val[3][2] = z;
        },

        scale(x, y, z) {
          self.load.identity();
          self.val[0][0] = x;
          self.val[1][1] = y;
          self.val[2][2] = z;
        },

        rotate(rad) {
          self.load.identity();
          self.val[0][0] = Math.cos(rad);
          self.val[1][0] = -Math.sin(rad);
          self.val[0][1] = Math.sin(rad);
          self.val[1][1] = Math.cos(rad);
        },
      },

      multiply(bMat) {
        let b = self.val;
        let a = bMat.val;

        for(let i = 0; i < 4; i++) {
          for(let j = 0; j < 4; j++) {
            multBuffer[i][j] = 0;
            for(let k = 0; k < 4; k++) {
              multBuffer[i][j]+= a[i][k] * b[k][j];
            }
          }
        }

        for(let i = 0; i < 4; i++) {
          for(let j = 0; j < 4; j++) {
            self.val[i][j] = multBuffer[i][j];
          }
        }
      }
    }

    return self;
  }
};

Mat4.identity = Mat4.create();

export let Mat4Stack = {
  create() {
    let stack = [];
    for(let i = 0; i < 16; i++) {
      stack[i] = Mat4.create();
    }
    
    let head = 0;
    
    let self = {
      reset() {
        head = 0;
      },
      push(matrix) {
        if(head+1 >= stack.length) {
          stack[head+1] = Mat4.create();
        }
        head++;
        stack[head].load.from(matrix);
      },
      pop(matrix) {
        matrix.load.from(stack[head--]);
      },
      peek(matrix) {
        matrix.load.from(stack[head]);
      }
    };
    
    return self;
  }
};

export let MatrixTransformer = {
  create() {
    let matrix;
    
    let apply = (x, y, z, c) => {
      return (matrix.val[0][c] * x) +
        (matrix.val[1][c] * y) +
        (matrix.val[2][c] * z) +
        (matrix.val[3][c] * 1);
    };
    
    let self = {
      x(x, y, z) {
        return apply(x, y, z, 0);
      },
      y(x, y, z) {
        return apply(x, y, z, 1);
      },
      z(x, y, z) {
        return apply(x, y, z, 2);
      },
      into(params, i, x, y, z) {
        params[i++] = apply(x, y, z, 0);
        params[i++] = apply(x, y, z, 1);
        params[i++] = apply(x, y, z, 2);
        return i;
      },
      useMatrix(mat) {
        matrix = mat;
      }
    };
    
    return self;
  }
};
