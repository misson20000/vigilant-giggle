import {AssetManager} from "../assetmgr.js";
import {Colors, Color, ColorUtils} from "../gfxutils.js";
import {Mat4, Mat4Stack} from "../math.js";
import {Keyboard} from "../keyboard.js";
import {Boat} from "../objects/boat.js";
import * as box2d from "box2d-html5";

let colors = {
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
  buoyancy.density = 5;
  buoyancy.linearDrag = 5;
  buoyancy.angularDrag = 2;

  let objects = [];
  
  let world = new box2d.b2World(new box2d.b2Vec2(0, 15));
//  objects.push(BeginningIsland(world));
  let islandDef = new box2d.b2BodyDef();
  islandDef.position.Set(0, 0);
  let island = world.CreateBody(islandDef);
  let islandFixtureDef = new box2d.b2FixtureDef();
  let islandShape = new box2d.b2PolygonShape();
  islandFixtureDef.shape = islandShape;
  islandFixtureDef.friction = 0.3;
  islandFixtureDef.filter.categoryBits = 0b11;
  islandFixtureDef.filter.maskBits = 0b11111111;
  islandShape.Set([
    new box2d.b2Vec2(5, 1.75),
    new box2d.b2Vec2(-5, 1.75),
    new box2d.b2Vec2(-5, -1.25),
    new box2d.b2Vec2(5, -1.25)], 4);
  island.CreateFixture(islandFixtureDef);
  islandShape.Set([
    new box2d.b2Vec2(-5, -1.25),
    new box2d.b2Vec2(-10, .25),
    new box2d.b2Vec2(-5, .25)], 3);
  island.CreateFixture(islandFixtureDef);
  islandShape.Set([
    new box2d.b2Vec2(-10, .25),
    new box2d.b2Vec2(-27, 2.25),
    new box2d.b2Vec2(-10, 2.25)], 3);
  island.CreateFixture(islandFixtureDef);
  islandShape.Set([
    new box2d.b2Vec2(5, -1.25),
    new box2d.b2Vec2(10, .25),
    new box2d.b2Vec2(5, .25)], 3);
  island.CreateFixture(islandFixtureDef);
  islandFixtureDef.filter.categoryBits = 0b01;
  islandShape.Set([
    new box2d.b2Vec2(5, -.3),
    new box2d.b2Vec2(10, -.3),
    new box2d.b2Vec2(10, -.7),
    new box2d.b2Vec2(5, -.7)
  ], 4);
  island.CreateFixture(islandFixtureDef);

  let playerDef = new box2d.b2BodyDef();
  playerDef.type = box2d.b2BodyType.b2_dynamicBody;
  playerDef.position.Set(0, -10);
  let playerBody = world.CreateBody(playerDef);
  let playerBox = new box2d.b2PolygonShape();
  playerBox.SetAsBox(1, 1);
  let playerFixtureDef = new box2d.b2FixtureDef();
  playerFixtureDef.shape = playerBox;
  playerFixtureDef.density = 1;
  playerFixtureDef.friction = 0.7;
  playerFixtureDef.filter.categoryBits = 0b111111;
  playerBody.CreateFixture(playerFixtureDef);
  buoyancy.AddBody(playerBody);

  objects.push(Boat(world, buoyancy, playerBody, true));
  
  world.AddController(buoyancy);
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
  
  let kb = Keyboard.create();
  let binds = {
    left: kb.createKeybind("ArrowLeft"),
    right: kb.createKeybind("ArrowRight")
  };

  let b2timer = 0;
  
  let self = {
    initialize() {
      // simulate 2 seconds of physics to give time for stuff to settle
      for(let i = 0; i < 2000; i+= 5) {
        world.Step(5.0 / 1000.0, 8, 3);
      }
      for(let i = 0; i < objects[i]; i++) {
        if(objects[i].isHologram) {
          objects[i].body.SetActive(false);
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

      self.drawIsland();
      self.drawBody(playerBody, self.drawPlayer);
      for(let i = 0; i < objects.length; i++) {
        let body = objects[i].body;
        matStack.push(matrix);
        opMatrix.load.translate(body.GetPosition().x, body.GetPosition().y, 0);
        matrix.multiply(opMatrix);
        opMatrix.load.rotate(body.GetAngleRadians());
        matrix.multiply(opMatrix);
        if(objects[i].isHologram) {
          shapes.useMaterial(holoMaterial);
        }
        objects[i].draw(shapes);
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
    drawPlayer() {
      shapes.drawColoredRect(colors.player, -1, -1, 1, 1);
    },
    drawIsland() {
      shapes.drawColoredRect(colors.dock, 5, -.3, 15, -.7);
      shapes.drawColoredRect(colors.dock, 14, -.7, 14.4, .5);
      
      shapes.drawColoredRect(colors.dirt, -5, -1.25, 5, .25);
      shapes.drawColoredRect(colors.boatStake, 7.5, 0, 8, -2);
      shapes.drawColoredRect(colors.rope, 7.45, -1.4, 8.05, -1.9);
      shapes.drawColoredTriangle(colors.grass, -5, -1.25, -10, .25, -5, .25);
      shapes.drawColoredTriangle(colors.dirt, -5, -1, -10, .5, -5, .5);
      shapes.drawColoredTriangle(colors.grass, 5, -1.25, 10, .25, 5, .25);
      shapes.drawColoredTriangle(colors.dirt, 5, -1, 10, .5, 5, .5);
      shapes.drawColoredRect(colors.grass, -5, -1.25, 5, -1);
      
      shapes.useMaterial(holoMaterial);
      shapes.drawColoredRect(colors.houseBody, -4, -5, 0, -1.25);
      shapes.drawColoredTriangle(colors.houseRoof, -4.5, -5, 0.5, -5, -2, -7);
      shapes.useMaterial(shapesMaterial);
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

      camera.x = playerBody.GetPosition().x * 40;
      camera.y = playerBody.GetPosition().y * 40;
      
      if(binds.right.isPressed()) {
        playerBody.SetAngularVelocity(2);
      }

      if(binds.left.isPressed()) {
        playerBody.SetAngularVelocity(-2);
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
      
      transition.draw(delta);
      time+= delta;
    },
    getKeyboard() {
      return kb;
    }
  };
  return self;
};
