import test from "node:test";
import assert from "node:assert/strict";

import { PawButton } from "../src/input/paw-button.mjs";

test("emits pressed only once while held", () => {
  const button = new PawButton();
  let count = 0;

  button.on("pressed", () => count++);

  button.press();
  button.press();

  assert.equal(count, 1);
  assert.equal(button.isPressed, true);
});

test("emits released when button is released", () => {
  const button = new PawButton();
  let count = 0;

  button.on("released", () => count++);

  button.press();
  button.release();
  button.release();

  assert.equal(count, 1);
  assert.equal(button.isPressed, false);
});