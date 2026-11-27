
import test from "node:test";
import assert from "node:assert/strict";
import { AudioRecorder } from "../src/audio/recorder.mjs";

test("records audio from the real microphone", async () => {
  const recorder = new AudioRecorder({
    device: "default",
    maxRecordingSeconds: 15
  });

  await recorder.start();

  assert.equal(recorder.isRecording, true);

  console.log("Puhu nyt mikrofoniin 5 sekunnin ajan...");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const audio = await recorder.stop();

  assert.ok(Buffer.isBuffer(audio));
  assert.ok(audio.length > 44);
  assert.equal(audio.toString("ascii", 0, 4), "RIFF");
  assert.equal(audio.toString("ascii", 8, 12), "WAVE");
  assert.equal(recorder.isRecording, false);

  console.log(`Tallennettu ${audio.length} tavua.`);
});
