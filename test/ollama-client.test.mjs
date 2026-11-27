
import test from "node:test";
import assert from "node:assert/strict";
import { OllamaClient } from "../src/llm/ollama-client.mjs";

test("Gemma 3 4B generates a Finnish response", async () => {
  const ollama = new OllamaClient();

  const answer = await ollama.generateResponse(
    "Minkä värinen aurinko on?"
  );

  console.log("\nGemman vastaus:", answer);

  assert.equal(typeof answer, "string");
  assert.ok(answer.length > 0);
});
