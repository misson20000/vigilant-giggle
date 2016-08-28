import {colors} from "../states/play.js";
import * as box2d from "box2d-html5";

export let BeginningIsland = (world) => {
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.position.Set(0, 0);
  let body = world.CreateBody(bodyDef);
  let fixtureDef = new box2d.b2FixtureDef();
  let shape = new box2d.b2PolygonShape();
  fixtureDef.shape = shape;
  fixtureDef.friction = 0.3;
  fixtureDef.filter.categoryBits = 0b11;
  fixtureDef.filter.maskBits = 0b11111111;
  shape.Set([
    new box2d.b2Vec2(5, 1.75),
    new box2d.b2Vec2(-5, 1.75),
    new box2d.b2Vec2(-5, -1.25),
    new box2d.b2Vec2(5, -1.25)], 4);
  body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(-5, -1.25),
    new box2d.b2Vec2(-10, .25),
    new box2d.b2Vec2(-5, .25)], 3);
  body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(-10, .25),
    new box2d.b2Vec2(-27, 2.25),
    new box2d.b2Vec2(-10, 2.25)], 3);
  body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(5, -1.25),
    new box2d.b2Vec2(10, .25),
    new box2d.b2Vec2(5, .25)], 3);
  body.CreateFixture(fixtureDef);
  fixtureDef.filter.categoryBits = 0b01;
  shape.Set([
    new box2d.b2Vec2(5, -.3),
    new box2d.b2Vec2(10, -.3),
    new box2d.b2Vec2(10, -.7),
    new box2d.b2Vec2(5, -.7)
  ], 4);
  body.CreateFixture(fixtureDef);

  let self = {
    body,
    isHologram: false,
    draw(shapes) {
      let z = 0.6;
      shapes.drawColoredRect(colors.dock, 5, -.3, 15, -.7, z);
      shapes.drawColoredRect(colors.dock, 14, -.7, 14.4, .5, z);
      
      shapes.drawColoredRect(colors.dirt, -5, -1.25, 5, .25, z);
      shapes.drawColoredRect(colors.boatStake, 7.5, 0, 8, -2, z);
      shapes.drawColoredRect(colors.rope, 7.45, -1.4, 8.05, -1.9, z);
      shapes.drawColoredTriangle(colors.grass, -5, -1.25, -10, .25, -5, .25, z);
      shapes.drawColoredTriangle(colors.dirt, -5, -1, -10, .5, -5, .5, z);
      shapes.drawColoredTriangle(colors.grass, 5, -1.25, 10, .25, 5, .25, z);
      shapes.drawColoredTriangle(colors.dirt, 5, -1, 10, .5, 5, .5, z);
      shapes.drawColoredRect(colors.grass, -5, -1.25, 5, -1, z);
    }
  };
  body.SetUserData(self);
  return self;
};

export let BeginningHouse = (island, world) => {
  let bodyDef = new box2d.b2BodyDef();
  bodyDef.position.Set(-2, -1.25);
  let body = world.CreateBody(bodyDef);
  let fixtureDef = new box2d.b2FixtureDef();
  let shape = new box2d.b2PolygonShape();
  fixtureDef.shape = shape;
  shape.Set([
    new box2d.b2Vec2(-2, -3.75),
    new box2d.b2Vec2(-2, 0),
    new box2d.b2Vec2(2, 0),
    new box2d.b2Vec2(2, -3.75)], 4);
  body.CreateFixture(fixtureDef);
  shape.Set([
    new box2d.b2Vec2(-2.5, -3.75),
    new box2d.b2Vec2(2.5, -3.75),
    new box2d.b2Vec2(0, -5.75)], 3);
  body.CreateFixture(fixtureDef);

  let self = {
    body: body,
    isHologram: true,
    draw(shapes) {
      let z = 0.4;
      shapes.drawColoredRect(colors.houseBody, -2, -3.75, 2, 0, z);
      shapes.drawColoredTriangle(colors.houseRoof, -2.5, -3.75, 2.5, -3.75, 0, -5.75, z);
    },
    shouldCollide(a, b, c) {
      return false;
    }
  };
  body.SetUserData(self);
  return self;
};
