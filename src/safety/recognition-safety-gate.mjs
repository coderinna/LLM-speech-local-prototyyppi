
const RETRY_RESPONSE =
  "En saanut ihan selvää. Voisitko sanoa sen uudelleen?";

const SPECIAL_TOKEN_PATTERN = /^\[.*\]$/u;
const NON_WORD_PATTERN = /^[\s\p{P}\p{S}]+$/u;

export class RecognitionSafetyGate {
  constructor({
    minTokenProbability = 0.20,
    minAverageProbability = 0.50
  } = {}) {
    if (
      !Number.isFinite(minTokenProbability) ||
      minTokenProbability < 0 ||
      minTokenProbability > 1
    ) {
      throw new RangeError(
        "minTokenProbability must be between 0 and 1"
      );
    }

    if (
      !Number.isFinite(minAverageProbability) ||
      minAverageProbability < 0 ||
      minAverageProbability > 1
    ) {
      throw new RangeError(
        "minAverageProbability must be between 0 and 1"
      );
    }

    this.minTokenProbability = minTokenProbability;
    this.minAverageProbability = minAverageProbability;
  }

  check(recognition) {
    if (
      !recognition ||
      typeof recognition !== "object" ||
      typeof recognition.text !== "string" ||
      !recognition.text.trim()
    ) {
      return this.#reject("INVALID_INPUT");
    }

    const metadata = recognition.metadata;

    if (
      !metadata ||
      !Array.isArray(metadata.transcription) ||
      !Array.isArray(recognition.segments)
    ) {
      return this.#reject("MISSING_METADATA");
    }

    if (
      metadata.transcription.length === 0 ||
      recognition.segments.length === 0
    ) {
      return this.#reject("EMPTY_TRANSCRIPTION");
    }

    const probabilities = [];

    for (const segment of recognition.segments) {
      if (
        !segment ||
        typeof segment.text !== "string" ||
        !Array.isArray(segment.tokens)
      ) {
        return this.#reject("INVALID_SEGMENT");
      }

      for (const token of segment.tokens) {
        if (
          !token ||
          typeof token.text !== "string"
        ) {
          return this.#reject("INVALID_TOKEN");
        }

        const tokenText = token.text.trim();

        // Whisperin erikoistokenit eivät ole puhuttuja sanoja.
        if (
          !tokenText ||
          SPECIAL_TOKEN_PATTERN.test(tokenText) ||
          NON_WORD_PATTERN.test(tokenText)
        ) {
          continue;
        }

        if (
          typeof token.p !== "number" ||
          !Number.isFinite(token.p) ||
          token.p < 0 ||
          token.p > 1
        ) {
          return this.#reject("INVALID_TOKEN_PROBABILITY");
        }

        probabilities.push(token.p);
      }
    }

    if (probabilities.length === 0) {
      return this.#reject("NO_SPEECH_TOKENS");
    }

    const averageProbability =
      probabilities.reduce((sum, value) => sum + value, 0) /
      probabilities.length;

    const minimumProbability = Math.min(...probabilities);

    const diagnostics = {
      tokenCount: probabilities.length,
      averageProbability,
      minimumProbability
    };

    if (
      minimumProbability < this.minTokenProbability
    ) {
      return this.#reject(
        "LOW_TOKEN_PROBABILITY",
        diagnostics
      );
    }

    if (
      averageProbability < this.minAverageProbability
    ) {
      return this.#reject(
        "LOW_AVERAGE_PROBABILITY",
        diagnostics
      );
    }

    return {
      allowed: true,
      reason: null,
      response: null,
      diagnostics
    };
  }

  #reject(reason, diagnostics = null) {
    return {
      allowed: false,
      reason,
      response: RETRY_RESPONSE,
      diagnostics
    };
  }
}
