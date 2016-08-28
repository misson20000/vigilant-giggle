import {AssetManager} from "../assetmgr.js";
import {Colors, Color, ColorUtils} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {Keyboard} from "../keyboard.js";
import {Boat} from "../objects/boat.js";
import {Player} from "../objects/player.js";
import {Tablet} from "../objects/tablet.js";
import {BeginningIsland, BeginningHouse} from "../objects/begisland.js";
import * as box2d from "box2d-html5";

export let colors = {
  bg: Color("#2698FC"),
  cloud: Color(0.8, 0.8, 1, 1),
  fg: Color(0.8, 0.8, 1, 1),
  dirt: Color("#5E3F1B"),
  grass: Color("#45A81E"),
  sun: Color(1, 1, 0, 1),
  moon: Color(0.8, 0.8, 0.8, 1),
  player: Color(0.8, 0.8, 0.8, 1),
  houseBody: Color(0.8, 0.7, 0.7, 1),
  houseRoof: Color("#5E3F1B"),
  boatStake: Color("#D99445"),
  rope: Color("#F5C998"),
  dock: Color("#806E3E"),
  water: ColorUtils.multRGB(Color(0.8, 0.8, 1, 1), 0.2),
  stars: ColorUtils.multRGB(Color(1, 0.8, 0.8, 1), 1)
};

let Cloud = () => {
  let w = 125;
  let h = 65;

  let self = {
    draw(shapes) {
      shapes.drawColoredRect(colors.cloud, -w/2, -h/2, w/2, h/2);
      let x = -w/2;
      for(let i = 0; i < rects.length; i++) {
        shapes.drawColoredRect(colors.cloud, x-(rects[i]/2), -(h/2)-(rects[i]/2), x+(rects[i]/2), -(h/2)+(rects[i]/2));
        x+= rects[i];
      }
    }
  };
  return self;
};

export let PlayState = (game, transition) => {
  let time = 0;
  
  let render = game.render;
  let shapesMaterial = render.createMaterial(AssetManager.getAsset("base.shader.flat.color"), {
    matrix: render.pixelMatrix
  });
  let tabletMaterial = render.createMaterial(AssetManager.getAsset("game.shader.tablet"), {
    matrix: render.pixelMatrix,
    time: () => {
      return time;
    }
  });
  let holoMaterial = render.createMaterial(AssetManager.getAsset("game.shader.hologram"), {
    matrix: render.pixelMatrix,
    time: () => {
      return time;
    },
    pixwidth: render.fbwidth,
    pixheight: render.fbheight
  });
  let font = render.createFontRenderer(AssetManager.getAsset("base.font.open_sans"),
                                       AssetManager.getAsset("base.shader.flat.texcolor"));
  let fb = render.createFramebuffer(100); // 100 pixels of padding
  let postMatrix = Mat4.create();
  let post = render.createMaterial(AssetManager.getAsset("game.shader.reflection"), {
    framebuffer: fb.getTexture(),
    perlin: AssetManager.getAsset("game.noise.perlin"),
    matrix: postMatrix,
    time: () => {
      return time;
    },
    pixwidth: render.fbwidth,
    pixheight: render.fbheight,
    refY: () => {
      return fb.ytoc(0);
    }
  });
  let shapes = render.createShapeDrawer();

  let opMatrix = Mat4.create();
  let matStack = Mat4Stack.create();
  let matrix = Mat4.create();

  let cloud = Cloud();

  let camera = {
    x: 0,
    y: -300
  };

  let skyColor = Color(0, 0, 0, 1);
  let starColor = Color(0, 0, 0, 1);
  
  let stars = [];
  for(let i = 0; i < 1000; i++) {
    stars.push([Math.random(), Math.random()]);
  }

  let lerp = (a, b, x) => {
    return a + x * (b-a);
  };

  let buoyancy = new box2d.b2BuoyancyController();
  buoyancy.normal.Set(0, -1);
  buoyancy.offset = 0;
  buoyancy.density = 3;
  buoyancy.linearDrag = 5;
  buoyancy.angularDrag = 2;

  let objects = [];
  let holoObject;
  let inHologramMode = false;
  
  let world = new box2d.b2World(new box2d.b2Vec2(0, 15));

  let manager = {
    world,
    remove(object) {
      world.DestroyBody(object.body);
      object.body.SetActive(false);
      let idx = objects.indexOf(object);
      if(idx >= 0) {
        objects.splice(idx, 1);
      }
    }
  };
  
  let island = BeginningIsland(world);
  let player = Player(world, buoyancy);
  let tablet = Tablet(manager, buoyancy, player, tabletMaterial);
  objects.push(island);
  objects.push(BeginningHouse(island, world));
  objects.push(player);
  objects.push(Boat(world, buoyancy, player.body, true));
  objects.push(tablet);
  
  world.AddController(buoyancy);
  world.SetContactFilter({
    ShouldCollide(a, b) {
      let objA = a.GetBody().GetUserData();
      let objB = b.GetBody().GetUserData();
      if((a.GetUserData() && a.GetUserData().noCollide)
         || (b.GetUserData() && b.GetUserData().noCollide)) {
        return false;
      }
      if(objA && objA.isHologram) {
        return false;
      }
      if(objB && objB.isHologram) {
        return false;
      }
      if(objA && objB) {
        return objA.shouldCollide ? objA.shouldCollide(objB, a, b) : true &&
          objB.shouldCollide ? objB.shouldCollide(objA, b, a) : true;
      } else {
        return true;
      }
    }
  });
  world.SetContactListener({
    BeginContact(contact) {
      let a = contact.GetFixtureA();
      let b = contact.GetFixtureB();
      let aData = a.GetBody().GetUserData();
      let bData = b.GetBody().GetUserData();
      if(aData && aData.BeginContact) {
        aData.BeginContact(a, b);
      }
      if(bData && bData.BeginContact) {
        bData.BeginContact(b, a);
      }
    },
    EndContact(contact) {
      let a = contact.GetFixtureA();
      let b = contact.GetFixtureB();
      let aData = a.GetBody().GetUserData();
      let bData = b.GetBody().GetUserData();
      if(aData && aData.BeginContact) {
        aData.BeginContact(a, b);
      }
      if(bData && bData.EndContact) {
        bData.EndContact(b, a);
      }
    },
    PreSolve(contact, manifold) {
    },
    PostSolve(contact, impulse) {
    }
  });

  let b2aabb = new box2d.b2AABB();
  
  let kb = Keyboard.create();
  let binds = {
    left: kb.createKeybind("ArrowLeft", "a"),
    right: kb.createKeybind("ArrowRight", "d")
  };

  let b2timer = 0;
  let hoverQueryCallback = (fixture) => {
    let object = fixture.GetBody().GetUserData();
    if(object) {
      object.hovering = true;
    }
    return true;
  };
  
  let self = {
    initialize() {
      // simulate 2 seconds of physics to give time for stuff to settle
      for(let i = 0; i < 2000; i+= 5) {
        world.Step(5.0 / 1000.0, 8, 3);
      }
      for(let i = 0; i < objects.length; i++) {
        if(objects[i].isHologram) {
          objects[i].body.SetType(box2d.b2BodyType.b2_staticBody);
        }
      }
    },
    dayCycle() {
      return time / 180000.0;
    },
    moonPhase() {
      return (self.dayCycle() / 29.530588853) % 1;
    },
    skyColor() {
      let fac = Math.sin((self.dayCycle() + 0.25)* Math.PI * 2) / 2 + 0.5;
      fac+= 0.1;
      fac = Math.min(fac, 1);
      skyColor.r = colors.bg.r * fac;
      skyColor.g = colors.bg.g * fac;
      skyColor.b = colors.bg.b * fac;
      return skyColor;
    },
    starColor() {
      let fac = Math.sin((self.dayCycle() + 0.25)* Math.PI * 2) / 2 + 0.5;
      fac = 1-fac; // 1 at night
      fac-= 0.5;
      fac*= 2;
      fac = Math.max(0, fac);
      starColor.r = lerp(skyColor.r, colors.stars.r, fac);
      starColor.g = lerp(skyColor.g, colors.stars.g, fac);
      starColor.b = lerp(skyColor.b, colors.stars.b, fac);
      //starColor = colors.stars;
    },
    drawScene() {
      render.clear(self.skyColor());
      matStack.push(matrix);
      
      opMatrix.load.translate(render.width()/2, render.height(), 0);
      matrix.multiply(opMatrix);

      matStack.push(matrix);
      opMatrix.load.translate(camera.x, camera.y, 0);
      matrix.multiply(opMatrix);
      
      self.starColor();
      for(let i = 0; i < stars.length; i++) {
        let star = stars[i];
        shapes.drawColoredRect(starColor,
                               (render.width() * star[0]) - 1.0 - render.width()/2,
                               (-render.height() * star[1]) - 1.0,
                               (render.width() * star[0]) + 1.0 - render.width()/2,
                               (-render.height() * star[1]) + 1.0);
      }
      matStack.pop(matrix);

      opMatrix.load.scale(40, 40, 1); // 1 game unit = 40 pixels
      matrix.multiply(opMatrix);
            
      matStack.push(matrix);
      opMatrix.load.translate(camera.x/40.0, camera.y/40.0, 0);
      matrix.multiply(opMatrix);

      matStack.push(matrix);
      opMatrix.load.rotate(self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      opMatrix.load.translate(0, -11.25, 0);
      matrix.multiply(opMatrix);
      opMatrix.load.rotate(-self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      self.drawSun();
      matStack.pop(matrix);

      matStack.push(matrix);
      opMatrix.load.rotate(self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);
      opMatrix.load.translate(0, 11.25, 0);
      matrix.multiply(opMatrix);
      opMatrix.load.rotate(-self.dayCycle()*Math.PI*2);
      matrix.multiply(opMatrix);

      let phase = self.moonPhase();
      if(phase < .25) {
        self.drawArc(skyColor, .5, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(colors.moon, .5, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((.25-phase)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(skyColor, .5, 0, Math.PI*2);
      } else if(phase < .5) {
        self.drawArc(skyColor, .5, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(colors.moon, .5, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((phase-.25)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(colors.moon, .5, 0, Math.PI*2);
      } else if(phase < .75) {
        phase-= .5;
        self.drawArc(colors.moon, .5, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(skyColor, .5, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((.75-phase-.5)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(colors.moon, .5, 0, Math.PI*2);        
      } else {
        self.drawArc(colors.moon, .5, -3*Math.PI/2, -Math.PI/2);
        self.drawArc(skyColor, .5, -Math.PI/2, Math.PI/2);
        opMatrix.load.scale((phase-.75)*4, 1, 1);
        matrix.multiply(opMatrix);
        self.drawArc(skyColor, .5, 0, Math.PI*2);
      }
      matStack.pop(matrix); // pop moon matrix
      matStack.pop(matrix); // pop celestial matrix

      for(let i = 0; i < objects.length; i++) {
        let body = objects[i].body;
        matStack.push(matrix);
        opMatrix.load.translate(body.GetPosition().x, body.GetPosition().y, 0);
        matrix.multiply(opMatrix);
        opMatrix.load.rotate(body.GetAngleRadians());
        matrix.multiply(opMatrix);
        if(inHologramMode || !objects[i].isHologram) {
          if(objects[i].isHologram) {
            shapes.useMaterial(holoMaterial);
            if(objects[i].hovering) {
              opMatrix.load.scale(1.1, 1.1, 1);
              matrix.multiply(opMatrix);
              if(game.mouse.justClicked()) {
                if(holoObject) {
                  holoObject.isHologram = true;
                  holoObject.body.SetType(box2d.b2BodyType.b2_staticBody);
                }
                holoObject = objects[i];
                holoObject.body.SetType(holoObject.isDynamic ? box2d.b2BodyType.b2_dynamicBody : box2d.b2BodyType.b2_staticBody);
                holoObject.isHologram = false;
              }
            }
          }
          objects[i].draw(shapes);
        }
        shapes.useMaterial(shapesMaterial);
        matStack.pop(matrix);
      }
      matStack.pop(matrix);
    },
    drawBody(body, cb) {
      matStack.push(matrix);
      opMatrix.load.translate(body.GetPosition().x, body.GetPosition().y, 0);
      matrix.multiply(opMatrix);
      opMatrix.load.rotate(body.GetAngleRadians());
      matrix.multiply(opMatrix);
      cb();
      matStack.pop(matrix);
    },
    drawSun() {
      matStack.push(matrix);
      let segments = 3;
      for(let i = 0; i < segments; i++) {
        shapes.drawColoredRect(colors.sun, -.75, -.75, .75, .75);
        opMatrix.load.rotate(Math.PI/(2*segments));
        matrix.multiply(opMatrix);
      }
      matStack.pop(matrix);
    },
    drawArc(color, rad, beg, end) {
      matStack.push(matrix);
      let segments = 40.0;
      let x = rad*Math.cos(beg);
      let y = rad*Math.sin(beg);
      for(let angle = beg; angle <= end; angle+= Math.PI/20.0) {
        if(angle > end) {
          angle = end;
        }
        let x2 = rad*Math.cos(angle);
        let y2 = rad*Math.sin(angle);
        shapes.drawColoredTriangle(color, x, y, 0, 0, x2, y2);
        x = x2;
        y = y2;
      }
      matStack.pop(matrix);
    },
    tick(delta) {
      b2timer+= delta;
      while(b2timer > 5) {
        world.Step(5.0 / 1000.0, 8, 3);
        b2timer-= 5;
      }

      camera.x = player.body.GetPosition().x * 40;
      camera.y = player.body.GetPosition().y * 40;
      
      if(binds.right.isPressed()) {
        player.body.SetAngularVelocity(2);
      }

      if(binds.left.isPressed()) {
        player.body.SetAngularVelocity(-2);
      }

      for(let i = 0; i < objects.length; i++) {
        if(objects[i].tick) {
          objects[i].tick();
        }
      }
      
      matStack.reset();
      matrix.load.identity();

      shapes.useMatrix(matrix);
      shapes.useMaterial(shapesMaterial);

      fb.bind();
      matStack.push(matrix);
      opMatrix.load.translate(-camera.x, 0, 0);
      matrix.multiply(opMatrix);
      self.drawScene();
      shapes.flush();
      matStack.pop(matrix);
      fb.unbind();
      
      opMatrix.load.translate(-camera.x, -render.height()/2-camera.y, 0);
      matrix.multiply(opMatrix);
      self.drawScene();
      shapes.flush();

      postMatrix.load.from(render.pixelMatrix);
      opMatrix.load.translate(0, render.height() + render.height()/2 - camera.y, 0);
      postMatrix.multiply(opMatrix);
      opMatrix.load.scale(1, -1, 1);
      postMatrix.multiply(opMatrix);
      
      post.drawQuad(fb.getAttributes());
      post.flush();

      matrix.load.identity();
      opMatrix.load.translate(35, 30, 0);
      matrix.multiply(opMatrix);

      if(tablet.isCollected()) {
        let tabletHover = game.mouse.x > 35-0.9*30 && game.mouse.y > 30-0.7*30 && game.mouse.x < 35+0.9*30 && game.mouse.y < 30+0.7*30;
        
        opMatrix.load.scale(tabletHover ? 75 : 60, tabletHover ? 75 : 60, 1);
        matrix.multiply(opMatrix);
        
        shapes.useMatrix(matrix);
        tablet.draw(shapes);
        shapes.flush();
        
        if(tabletHover && game.mouse.justClicked()) {
          inHologramMode = !inHologramMode;
        }
      }

      for(let i = 0; i < objects.length; i++) {
        objects[i].hovering = false;
      }
      b2aabb.lowerBound.Set((game.mouse.x - render.width()/2  + camera.x - 1) / 40.0,
                            (game.mouse.y - render.height()/2 + camera.y - 1) / 40.0);
      b2aabb.upperBound.Set((game.mouse.x - render.width()/2  + camera.x + 1) / 40.0,
                            (game.mouse.y - render.height()/2 + camera.y + 1) / 40.0);
      world.QueryAABB(hoverQueryCallback, b2aabb);
      
      transition.draw(delta);
      time+= delta;
    },
    getKeyboard() {
      return kb;
    }
  };
  return self;
};
