
import { PawButton } from "./input/paw-button.mjs";
import { AudioRecorder } from "./audio/recorder.mjs";
import { WhisperClient } from "./speech/whisper-client.mjs";
import { ConversationEngine } from "./conversation/conversation-engine.mjs";
import { OllamaClient } from "./llm/ollama-client.mjs";
import { PiperClient } from "./tts/piper-client.mjs";
import { SafetyGuard } from "./safety/safety-guard.mjs";
import { RecognitionSafetyGate } from "./safety/recognition-safety-gate.mjs";
import { settings } from "./config/settings.mjs";

const button = new PawButton();
const recorder = new AudioRecorder();

const whisper = new WhisperClient({
  language: settings.speech.language,
  modelPath: settings.speech.modelPath,
  executable: "./whisper.cpp/build/bin/whisper-cli"
});

const ollama = new OllamaClient({
  model: "gemma3:4b"
});

const safetyGuard = new SafetyGuard();
const recognitionSafetyGate = new RecognitionSafetyGate();

const selectedVoice = "harri";

const piper = new PiperClient({
  voice: selectedVoice
});

const conversation = new ConversationEngine({
  speechRecognizer: whisper,
  languageModel: ollama,
  safetyGuard,
  recognitionSafetyGate
});

let turnInProgress = false;
let recordingStartPromise = null;

console.log(`[LLM-speech-local-DEMO] Valittu ääni: ${selectedVoice}`);

console.log("--------------------------------");
console.log(settings.application.name);
console.log(`Version: ${settings.application.version}`);
console.log("Mode: Offline prototype");
console.log("Speech recognition: Whisper.cpp");
console.log("Language model: Gemma 3 4B (Ollama)");
console.log("Speech synthesis: Piper (Finnish Harri)");
console.log("Recognition safety gate: Enabled");
console.log("Content safety guard: Enabled");
console.log("Conversation lock: Enabled");
console.log("--------------------------------");

await button.start();

button.on("pressed", async () => {
  if (turnInProgress) {
    console.log(
      "[LLM-speech-local-DEMO] Keskustelu on jo käynnissä."
    );
    return;
  }

  turnInProgress = true;

  console.log(
    "\n[LLM-speech-local-DEMO] Painiketta painettu: aloita puheen tallennus"
  );
  console.log("[LLM-speech-local-DEMO] Kuuntelen...");

  recordingStartPromise = recorder.start();

  try {
    await recordingStartPromise;
  } catch (error) {
    console.error(
      "[Error] Tallennuksen aloitus:",
      error.message
    );

    turnInProgress = false;
    recordingStartPromise = null;
  }
});

button.on("released", async () => {
  if (!turnInProgress) {
    return;
  }

  console.log(
    "[LLM-speech-local-DEMO] Painike vapautettu: lopetan puheen tallennuksen"
  );

  try {
    if (recordingStartPromise) {
      await recordingStartPromise;
    }

    const audioBuffer = await recorder.stop();

    if (!Buffer.isBuffer(audioBuffer)) {
      throw new Error(
        "Tallennin ei palauttanut äänitiedostoa"
      );
    }

    console.log("[LLM-speech-local-DEMO] Tunnistan puhetta...");

    const result = await conversation.process(audioBuffer);

    console.log("\n[LLM-speech-local-DEMO] Tunnistettu puhe:");
    console.log(
      result.recognizedText || "(Puhetta ei tunnistettu)"
    );

    if (result.blocked) {
      console.log(
        `[LLM-speech-local-DEMO] Käsittely estettiin: ${result.reason}`
      );
    }

    if (result.response) {
      console.log("\n[LLM-speech-local-DEMO] Vastaa:");
      console.log(result.response);

      console.log(
        "[LLM-speech-local-DEMO] Vastataan puhumalla..."
      );

      await piper.speak(result.response);

      console.log(
        "[LLM-speech-local-DEMO] Vastaus puhuttu."
      );
    }
  } catch (error) {
    console.error(
      "[Error] Puheenkäsittely:",
      error.message
    );
  } finally {
    turnInProgress = false;
    recordingStartPromise = null;

    console.log(
      "[LLM-speech-local-DEMO] Valmis. Odotan seuraavaa painallusta."
    );
  }
});

console.log(
  "[LLM-speech-local-DEMO] Valmis. Paina Enter aloittaaksesi puheen."
);