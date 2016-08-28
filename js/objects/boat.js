import {Colors, Color, ColorUtils} from "../gfxutils.js";
import * as box2d from "box2d-html5";

let color = Color("#D99445");

export let Boat = (world, buoyancy, player, isHologram) => {
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.type = box2d.b2BodyType.b2_dynamicBody;
  bodyDef.position.Set(12, -1);
  let body = world.CreateBody(bodyDef);
  let shape = new box2d.b2PolygonShape();
  let fixtureDef = new box2d.b2FixtureDef();
  fixtureDef.density = 0.1;
  fixtureDef.friction = 0.2;
  fixtureDef.filter.maskBits = 0b10;
  fixtureDef.shape = shape;
  shape.Set([
    new box2d.b2Vec2(-2.5, -.75),
    new box2d.b2Vec2(-2.3, -.75),
    new box2d.b2Vec2(-2.3, .5),
    new box2d.b2Vec2(-2.5, .5)
  ], 4);
  body.CreateFixture(fixtureDef);
  shape.Set([ // right side
    new box2d.b2Vec2(2.3, .5),
    new box2d.b2Vec2(2.3, -.75),
    new box2d.b2Vec2(3.5, -.75),
    new box2d.b2Vec2(2.5, .75)
  ], 4);
  body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(-2.5, .75),
    new box2d.b2Vec2(-2.5, .5),
    new box2d.b2Vec2(2.5, .5),
    new box2d.b2Vec2(2.5, .75)
  ], 4);
  body.CreateFixture(fixtureDef);
  fixtureDef.density = 10;
  shape.Set([
    new box2d.b2Vec2(-.5, 10),
    new box2d.b2Vec2(.5, 10),
    new box2d.b2Vec2(.5, 11),
    new box2d.b2Vec2(-.5, 10)
  ], 4);
  body.CreateFixture(fixtureDef);
  fixtureDef.density = 0;
  shape.Set([
    new box2d.b2Vec2(-2.3, .5),
    new box2d.b2Vec2(2.3, .5),
    new box2d.b2Vec2(2.3, .4),
    new box2d.b2Vec2(-2.3, .4)
  ], 4);
  fixtureDef.isSensor = true;
  let sensor = body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(-2.3, -.75),
    new box2d.b2Vec2(2.3, -.75),
    new box2d.b2Vec2(2.3, .5),
    new box2d.b2Vec2(-2.3, .5)
  ], 4);
  fixtureDef.isSensor = false;
  let area = body.CreateFixture(fixtureDef);
  let noCollide = {
    noCollide: true
  };
  area.SetUserData(noCollide);
  
  buoyancy.AddBody(body);

  let riding = false;
  let force = new box2d.b2Vec2(200, 0);
  let hitWall = false;
  
  let self = {
    body,
    isHologram,
    isDynamic: true,
    BeginContact(a, b) {
      if(a == sensor && b.GetBody() == player) {
        riding = true;
      }
      if(b.GetUserData() && b.GetUserData().stopsBoats) {
        hitWall = true;
        force.x = 50;
        console.log("stopping boat");
      }
    },
    EndContact(a, b) {
      if(a == sensor && b.GetBody() == player) {
        riding = false;
      }      
    },
    draw(shapes) {
      shapes.drawColoredRect(color, -2.5, -.75, 2.5, .75, 0.5);
      shapes.drawColoredTriangle(color, 3.5, -.75, 2.5, -.75, 2.5, .75, 0.5);
    },
    tick() {
      if(riding) {
        body.ApplyForce(force, body.GetPosition());
      }
    }
  };
  body.SetUserData(self);
  return self;
};
