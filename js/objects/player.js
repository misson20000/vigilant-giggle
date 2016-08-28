import {colors} from "../states/play.js";
import * as box2d from "box2d-html5";

export let Player = (world, buoyancy) => {
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.type = box2d.b2BodyType.b2_dynamicBody;
  bodyDef.position.Set(0, -10);
  let body = world.CreateBody(bodyDef);
  let shape = new box2d.b2PolygonShape();
  shape.SetAsBox(1, 1);
  let fixtureDef = new box2d.b2FixtureDef();
  fixtureDef.shape = shape;
  fixtureDef.density = 1;
  fixtureDef.friction = 0.7;
  fixtureDef.filter.categoryBits = 0b111111;
  body.CreateFixture(fixtureDef);
  buoyancy.AddBody(body);

  let self = {
    body,
    isHologram: false,
    draw(shapes) {
      shapes.drawColoredRect(colors.player, -1, -1, 1, 1, 0.5);
    }
  };
  body.SetUserData(self);
  return self;
};
