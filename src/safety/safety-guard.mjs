
import { SAFETY_RULES } from "./safety-rules.mjs";

export class SafetyGuard {
  checkInput(text) {
    if (typeof text !== "string" || !text.trim()) {
      return {
        allowed: false,
        reason: "INVALID_INPUT",
        response: "En saanut kysymyksestäsi selvää. Voitko sanoa sen uudelleen?"
      };
    }

    const normalized = text
      .normalize("NFKC")
      .toLocaleLowerCase("fi-FI");

    for (const rule of SAFETY_RULES) {
      if (rule.patterns.some(pattern => pattern.test(normalized))) {
        return {
          allowed: false,
          reason: rule.reason,
          response: rule.response
        };
      }
    }

    return {
      allowed: true,
      reason: null,
      response: null
    };
  }
}
