import {Colors, Color, ColorUtils} from "../gfxutils.js";
import * as box2d from "box2d-html5";

export let Tablet = (manager, buoyancy, player, mat) => {
  let size = {
    w: 0.9,
    h: 0.7
  };
  
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.type = box2d.b2BodyType.b2_dynamicBody;
  bodyDef.position.Set(-10, -10);
  let body = manager.world.CreateBody(bodyDef);
  let shape = new box2d.b2PolygonShape();
  shape.SetAsBox(size.w/2, size.h/2);
  let fixtureDef = new box2d.b2FixtureDef();
  fixtureDef.shape = shape;
  fixtureDef.density = 1;
  fixtureDef.friction = 0.7;
  fixtureDef.filter.categoryBits = 0b111111;
  body.CreateFixture(fixtureDef);
  buoyancy.AddBody(body);

  let collected = false;
  
  let self = {
    body,
    draw(shapes) {
      shapes.useMaterial(mat);
      shapes.drawTexturedRect(-size.w/2, -size.h/2, size.w/2, size.h/2, 0, 0, 1, 1, 0.55);
    },
    BeginContact(a, b) {
      if(b.GetBody() == player.body) {
        manager.remove(self);
        collected = true;
      }
    },
    isCollected() {
      return collected;
    }
  };
  body.SetUserData(self);
  return self;
};
