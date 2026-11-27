
import test from "node:test";
import assert from "node:assert/strict";

import {
  RecognitionSafetyGate
} from "../src/safety/recognition-safety-gate.mjs";

function createRecognition(probabilities = [0.8, 0.9, 0.95]) {
  const tokens = probabilities.map((p, index) => ({
    text: ` sana${index}`,
    p
  }));

  const segment = {
    text: " Testipuhe",
    tokens
  };

  return {
    text: "Testipuhe",
    segments: [segment],
    metadata: {
      transcription: [segment]
    }
  };
}

test("hyväksyy riittävän selkeän tunnistuksen", () => {
  const gate = new RecognitionSafetyGate();

  const result = gate.check(createRecognition());

  assert.equal(result.allowed, true);
  assert.equal(result.reason, null);
});

test("hylkää tyhjän tunnistuksen", () => {
  const gate = new RecognitionSafetyGate();

  const result = gate.check({
    text: "",
    segments: [],
    metadata: {
      transcription: []
    }
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "INVALID_INPUT");
});

test("hylkää puuttuvat metatiedot", () => {
  const gate = new RecognitionSafetyGate();

  const result = gate.check({
    text: "Testipuhe"
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "MISSING_METADATA");
});

test("hylkää liian epävarman yksittäisen tokenin", () => {
  const gate = new RecognitionSafetyGate();

  const result = gate.check(
    createRecognition([0.8, 0.1, 0.95])
  );

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "LOW_TOKEN_PROBABILITY");
});

test("hylkää liian matalan keskiarvon", () => {
  const gate = new RecognitionSafetyGate();

  const result = gate.check(
    createRecognition([0.4, 0.45, 0.5])
  );

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "LOW_AVERAGE_PROBABILITY");
});

test("ohittaa Whisperin erikoistokenit", () => {
  const gate = new RecognitionSafetyGate();

  const recognition = createRecognition([0.8, 0.9]);

  recognition.segments[0].tokens.unshift({
    text: "[_BEG_]",
    p: 0.01
  });

  const result = gate.check(recognition);

  assert.equal(result.allowed, true);
});

test("hylkää virheellisen token-arvon", () => {
  const gate = new RecognitionSafetyGate();

  const recognition = createRecognition();
  recognition.segments[0].tokens[0].p = undefined;

  const result = gate.check(recognition);

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    "INVALID_TOKEN_PROBABILITY"
  );
});
