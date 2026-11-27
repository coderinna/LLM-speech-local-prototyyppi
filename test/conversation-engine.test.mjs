
import test from "node:test";
import assert from "node:assert/strict";

import { SafetyGuard } from "../src/safety/safety-guard.mjs";
import {
  ConversationEngine
} from "../src/conversation/conversation-engine.mjs";

test("passes audio to speech recognizer", async () => {
  const recognizer = {
    async transcribe(buffer) {
      assert.equal(buffer.toString(), "test-audio");

      return {
        text: "Hei LLM-speech-local-DEMO",
        segments: [
          {
            text: "Hei LLM-speech-local-DEMO",
            tokens: [
              { text: "Hei", p: 0.99 },
              { text: " AI", p: 0.99 },
              { text: "-", p: 0.99 },
              { text: "LLM", p: 0.99 },
              { text: "-Chat", p: 0.99 }
            ]
          }
        ],
        metadata: {
          transcription: [
            {
              text: "Hei LLM-speech-local-DEMO"
            }
          ]
        }
      };
    }
  };

  const engine = new ConversationEngine({
    speechRecognizer: recognizer,
    safetyGuard: new SafetyGuard()
  });

  const result = await engine.process(
    Buffer.from("test-audio")
  );

  assert.equal(result.recognizedText, "Hei LLM-speech-local-DEMO");
  assert.equal(result.response, null);
  assert.equal(result.blocked, false);
});
