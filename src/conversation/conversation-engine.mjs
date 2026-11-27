
import { RecognitionSafetyGate } from "../safety/recognition-safety-gate.mjs";

export class ConversationEngine {
  constructor({
    speechRecognizer,
    languageModel = null,
    safetyGuard,
    recognitionSafetyGate = new RecognitionSafetyGate()
  }) {
    if (
      !speechRecognizer ||
      typeof speechRecognizer.transcribe !== "function"
    ) {
      throw new TypeError("speechRecognizer is required");
    }

    if (
      languageModel !== null &&
      typeof languageModel.generateResponse !== "function"
    ) {
      throw new TypeError(
        "languageModel must provide generateResponse()"
      );
    }

    if (
      !safetyGuard ||
      typeof safetyGuard.checkInput !== "function"
    ) {
      throw new TypeError("safetyGuard is required");
    }

    if (
      !recognitionSafetyGate ||
      typeof recognitionSafetyGate.check !== "function"
    ) {
      throw new TypeError(
        "recognitionSafetyGate must provide check()"
      );
    }

    this.speechRecognizer = speechRecognizer;
    this.languageModel = languageModel;
    this.safetyGuard = safetyGuard;
    this.recognitionSafetyGate = recognitionSafetyGate;
  }

  async process(audioBuffer) {
    const recognition = await this.speechRecognizer.transcribe(
      audioBuffer
    );

    const recognizedText =
      typeof recognition === "string"
        ? recognition.trim()
        : typeof recognition?.text === "string"
          ? recognition.text.trim()
          : "";

    if (!recognizedText) {
      return {
        recognizedText,
        response:
          "En saanut kysymyksestäsi selvää. Voitko sanoa sen uudelleen?",
        blocked: true,
        reason: "INVALID_INPUT"
      };
    }

    // Vanha string-palautemuoto ei sisällä token-metatietoja.
    // Siksi sitä ei voi hyväksyä tämän tunnistusportin läpi.
    if (typeof recognition === "string") {
      return {
        recognizedText,
        response:
          "En saanut puheestasi riittävän selvää. Voitko sanoa sen uudelleen?",
        blocked: true,
        reason: "MISSING_RECOGNITION_METADATA"
      };
    }

    // 1. Tunnistuksen luotettavuuden tarkistus.
    const recognitionResult =
      this.recognitionSafetyGate.check(recognition);

    if (!recognitionResult.allowed) {
      return {
        recognizedText,
        recognition,
        response: recognitionResult.response,
        blocked: true,
        reason: recognitionResult.reason,
        diagnostics: recognitionResult.diagnostics
      };
    }

    // 2. Tunnistetun tekstin sisältöturvallisuuden tarkistus.
    const safetyResult = this.safetyGuard.checkInput(
      recognizedText
    );

    if (!safetyResult.allowed) {
      return {
        recognizedText,
        recognition,
        response: safetyResult.response,
        blocked: true,
        reason: safetyResult.reason,
        diagnostics: recognitionResult.diagnostics
      };
    }

    // 3. Vasta nyt kysymys voidaan lähettää kielimallille.
    let response = null;

    if (this.languageModel) {
      response = await this.languageModel.generateResponse(
        recognizedText
      );
    }

    return {
      recognizedText,
      recognition,
      response,
      blocked: false,
      reason: null,
      diagnostics: recognitionResult.diagnostics
    };
  }
}
