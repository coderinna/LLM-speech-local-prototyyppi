
export class OllamaClient {
  constructor({
    baseUrl = "http://127.0.0.1:11434",
    model = "gemma3:4b",
    timeoutMs = 120000
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generateResponse(message) {
    if (typeof message !== "string" || !message.trim()) {
      throw new TypeError("message must be a non-empty string");
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    );

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,

          // Vapauta malli muistista vastauksen jälkeen.
          keep_alive: 0,

          messages: [
            {
              role: "system",
        content: [
 "Olet LLM-speech-local-DEMO, mukava ja kiva.",
  "Puhu aina suomea.",
  "Älä käytä hymiöitä, emojeita tai erikoisia tekstisymboleja.",
  "Älä keksi vastauksia, jos et tiedä.",
  "Älä anna vaarallisia ohjeita."
].join(" ")
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          options: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.message?.content?.trim();

      if (!answer) {
        throw new Error("Ollama returned an empty response");
      }

      return answer;
    } finally {
      clearTimeout(timeout);
    }
  }
}
