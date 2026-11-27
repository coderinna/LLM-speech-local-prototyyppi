
import test from "node:test";
import assert from "node:assert/strict";
import { PiperClient } from "../src/tts/piper-client.mjs";

test("Piper tuottaa ja toistaa suomenkielisen puhevastauksen", async () => {
  const piper = new PiperClient();

  const result = await piper.speak(
    "Hei! Minä olen sinun LLM-speech-local-DEMOsi. Mukava jutella kanssasi!"
  );

  assert.equal(result, true);
});

test("Piper hylkää tyhjän puhetekstin", async () => {
  const piper = new PiperClient();

  await assert.rejects(
    () => piper.speak("   "),
    {
      name: "TypeError"
    }
  );
});
