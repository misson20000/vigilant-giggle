import {colors} from "../states/play.js";
import * as box2d from "box2d-html5";

export let Mainland = (world) => {
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.position.Set(60, 0);
  let body = world.CreateBody(bodyDef);
  let fixtureDef = new box2d.b2FixtureDef();
  let shape = new box2d.b2PolygonShape();
  fixtureDef.shape = shape;
  fixtureDef.friction = 0.6;
  shape.Set([ // left edge
    new box2d.b2Vec2(-5, -1.25),
    new box2d.b2Vec2(-5, .25),
    new box2d.b2Vec2(-10, .25),
    new box2d.b2Vec2(-10, 10),
    new box2d.b2Vec2(-5, 10)], 3);
  let fix = body.CreateFixture(fixtureDef);
  fix.SetUserData({stopsBoats: true});

  let self = {
    body,
    isHologram: false,
    draw(shapes) {
      let z = 0.6;
      shapes.drawColoredTriangle(colors.grass, -5, -1.25, -10, .25, -5, .25, z);
      shapes.drawColoredTriangle(colors.dirt, -5, -1, -10, .5, -5, .5, z);
    }
  };
  body.SetUserData(self);
  return self;
};
