import test from "node:test";
import assert from "node:assert/strict";

import { SafetyGuard } from "../src/safety/safety-guard.mjs";
import { RecognitionSafetyGate } from "../src/safety/recognition-safety-gate.mjs";
import {
  ConversationEngine
} from "../src/conversation/conversation-engine.mjs";

function createRecognition({
  text = "Hei, miten voit?",
  probabilities = [0.99, 0.98, 0.97, 0.96]
} = {}) {
  return {
    text,
    segments: [
      {
        text,
        tokens: probabilities.map((p, index) => ({
          text: index === 0 ? "Hei" : ` token${index}`,
          p
        }))
      }
    ],
    metadata: {
      transcription: [
        {
          text
        }
      ]
    }
  };
}

function createEngine({
  recognition,
  languageModel,
  recognitionSafetyGate = new RecognitionSafetyGate()
} = {}) {
  const speechRecognizer = {
    async transcribe(buffer) {
      assert.equal(buffer.toString(), "test-audio");
      return recognition;
    }
  };

  return new ConversationEngine({
    speechRecognizer,
    languageModel,
    safetyGuard: new SafetyGuard(),
    recognitionSafetyGate
  });
}

test("integration: accepted recognition reaches the language model", async () => {
  let languageModelCalls = 0;
  let receivedPrompt = null;

  const languageModel = {
    async generateResponse(prompt) {
      languageModelCalls += 1;
      receivedPrompt = prompt;
      return "Voin hyvin, kiitos.";
    }
  };

  const recognition = createRecognition({
    text: "Hei, miten voit?"
  });

  const engine = createEngine({
    recognition,
    languageModel
  });

  const result = await engine.process(
    Buffer.from("test-audio")
  );

  assert.equal(result.recognizedText, "Hei, miten voit?");
  assert.equal(result.response, "Voin hyvin, kiitos.");
  assert.equal(result.blocked, false);
  assert.equal(result.reason, null);
  assert.equal(languageModelCalls, 1);
  assert.equal(receivedPrompt, "Hei, miten voit?");
  assert.equal(result.diagnostics.tokenCount, 4);
});

test("integration: low-confidence recognition is blocked before the language model", async () => {
  let languageModelCalls = 0;

  const languageModel = {
    async generateResponse() {
      languageModelCalls += 1;
      return "Tätä ei pitäisi tapahtua.";
    }
  };

  const recognition = createRecognition({
    text: "Epäselvä puhe",
    probabilities: [0.19, 0.95, 0.96, 0.97]
  });

  const engine = createEngine({
    recognition,
    languageModel
  });

  const result = await engine.process(
    Buffer.from("test-audio")
  );

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "LOW_TOKEN_PROBABILITY");
  assert.equal(
    result.response,
    "En saanut ihan selvää. Voisitko sanoa sen uudelleen?"
  );
  assert.equal(languageModelCalls, 0);
  assert.equal(result.diagnostics.minimumProbability, 0.19);
});

test("integration: low average recognition confidence is blocked before the language model", async () => {
  let languageModelCalls = 0;

  const languageModel = {
    async generateResponse() {
      languageModelCalls += 1;
      return "Tätä ei pitäisi tapahtua.";
    }
  };

  const recognition = createRecognition({
    text: "Epävarma tunnistus",
    probabilities: [0.40, 0.45, 0.50, 0.55]
  });

  const engine = createEngine({
    recognition,
    languageModel
  });

  const result = await engine.process(
    Buffer.from("test-audio")
  );

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "LOW_AVERAGE_PROBABILITY");
  assert.equal(languageModelCalls, 0);
  assert.equal(result.diagnostics.tokenCount, 4);assert.ok(
  Math.abs(result.diagnostics.averageProbability - 0.475) < 1e-12
);
});

test("integration: missing recognition metadata is blocked before the language model", async () => {
  let languageModelCalls = 0;

  const languageModel = {
    async generateResponse() {
      languageModelCalls += 1;
      return "Tätä ei pitäisi tapahtua.";
    }
  };

  const recognition = {
    text: "Hei, miten voit?",
    segments: [
      {
        text: "Hei, miten voit?",
        tokens: [
          { text: "Hei", p: 0.99 }
        ]
      }
    ]
  };

  const engine = createEngine({
    recognition,
    languageModel
  });

  const result = await engine.process(
    Buffer.from("test-audio")
  );

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "MISSING_METADATA");
  assert.equal(languageModelCalls, 0);
});
